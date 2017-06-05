'use strict';


gameEngine.classes.Renderer = function () {
    
    this.tileset = {
        color: {
            imgElement: {},
            blobUrl : {}
        },
        gray: {
            imgElement: {},
            blobUrl : {}
        },
    };
};

gameEngine.classes.Renderer.prototype = {
    init: function () {
        loadTileset();
    },
    
    downloadColorTileset : function () {
        let instance = this;
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("error", gameEngine.client.eventManager.onXhrError);
        xhr.addEventListener("abort", gameEngine.client.eventManager.onXhrError);
        xhr.addEventListener("progress", function (evt) {
            if (evt.lengthComputable && document.getElementById('tilesetLoadProgress') !== null) {
                let percentComplete = parseInt(100.0 * evt.loaded / evt.total);
                document.getElementById('tilesetLoadProgress').style.width = percentComplete + '%';
            }
        });
        xhr.addEventListener("load", function (evt) {
            let img = new Image();
            img.onload = function () {
                instance.tileset.color.imgElement = img;
                instance.generateGrayscaleTileset();
                if (document.getElementById('tilesetLoadBg') !== null) {
                    document.getElementById('tilesetLoadBg').style.display = 'none';
                }
            }
            instance.tileset.color.blobUrl = window.URL.createObjectURL(this.response); // closure is needed, otherwise at this point 'this' would be xhr
            img.src = instance.tileset.color.blobUrl;
        });
        xhr.open('GET', '/src/img/murmures.png', true);
        xhr.responseType = "blob";
        xhr.send(null);
    },
    
    generateGrayscaleTileset : function () {
        let canvas = document.createElement('canvas');
        canvas.width = this.tileset.color.imgElement.width;
        canvas.height = this.tileset.color.imgElement.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(this.tileset.color.imgElement, 0, 0);
        let imageData = ctx.getImageData(0, 2239, canvas.width, 2465 - 2239);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // red
            data[i + 1] = avg; // green
            data[i + 2] = avg; // blue
        // do not change alpha value
        }
        ctx.putImageData(imageData, 0, 2239);
        // Code below is slightly faster (than toDataURL) on chrome51 but breaks IE11 compatibility.
        // Keeping it in comment for now.
        //canvas.toBlob(function (blob) {
        //    gameEngine.client.tilesetGray = window.URL.createObjectURL(blob);
        //    let img = new Image();
        //    img.onload = function () {
        //        gameEngine.client.tilesetImgGray = img;
        //        screenLog('loaded2');
        //        tilesetLoaded();
        //    }
        //    img.src = gameEngine.client.tilesetGray;
        //});
        let instance = this;
        let img = new Image();
        img.onload = function () {
            instance.tileset.gray.imgElement = img;
            tilesetLoaded();
        }
        instance.tileset.gray.blobUrl = canvas.toDataURL();
        img.src = instance.tileset.gray.blobUrl;
    },

};
