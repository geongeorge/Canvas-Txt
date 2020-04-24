let canvasTxt = window.canvasTxt.default;

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var txt = "Lorem ipsum dolor sit amet";

canvasTxt.textSize = 24;
canvasTxt.debug = true;

canvasTxt.drawText(ctx, txt, 120, 120, 250, 200);
