export default {
    debug: false,
    align: "center",
    textSize: 14,
    font: "Arial",
    lineHeight : null,
    drawText: function(ctx,mytext,x,y,width,height) {


                const loc = [x,y,width,height]

                const style = this.textSize+"px "+this.font
                ctx.font = style

                let txty = parseInt(loc[1]) + (parseInt(loc[3])/2) + parseInt(this.textSize)/2


                let textanchor = parseInt(loc[0]) + (parseInt(loc[2])/2)
                ctx.textAlign = "center"

                if(this.align) {
                    if(this.align=="right"){

                        textanchor = parseInt(loc[0]) + parseInt(loc[2])
                        ctx.textAlign = "right"

                    } else if(this.align=="left"){

                        textanchor = parseInt(loc[0]) 
                        ctx.textAlign = "left"
                    }
                }  

                
                
                //added one-line only auto linebreak feature
                let textarray = [];
                let temptextarray = this.arrayMaker(mytext)
                
                temptextarray.forEach((txtt) => {

                
                let textwidth = ctx.measureText(txtt).width
                if(textwidth <= loc[2]) {
                    textarray.push(txtt)
                }
                else {
                    let temptext = txtt
                    let linelen = loc[2]
                    let textlen
                    let textpixlen

                    textwidth = ctx.measureText(temptext).width
                    while(textwidth > linelen){
                        textlen = 0;
                        textpixlen = 0;
                        let texttoprint = ""
                        while(textpixlen < linelen){
                            textlen++;
                            texttoprint = temptext.substr(0,textlen)
                            textpixlen = ctx.measureText(temptext.substr(0,textlen)).width
                        }
                          //if statement ensures a new line only happens at a space, and not amidst a word
                          if(temptext.substr(textlen,1) != " "){
                            const backup = textlen;
                            while(temptext.substr(textlen,1) != " " && textlen != 0){
                              textlen--;
                            }
                            if(textlen == 0){
                              textlen = backup;
                            }
                            texttoprint = temptext.substr(0,textlen)
                          }
                        
                        temptext = temptext.substr(textlen)
                        textwidth = ctx.measureText(temptext).width
                        textarray.push(texttoprint)
                        
                    }
                    if(textwidth > 0){
                        textarray.push(temptext)
                    }
                    
                }
                // end foreach temptextarray
                })
                //set vertical center
                let charHeight = ctx.measureText('M').width; //close approximation of height with width
                if(this.lineHeight) 
                    charHeight=this.lineHeight
                let vheight = charHeight*(textarray.length-1);
                let negoffset = vheight/2;
                txty=txty-negoffset;
                //print all lines of text
                textarray.forEach((txtline) => {
                    ctx.fillText(txtline,textanchor,txty)
                    txty+=charHeight
                })

                if(this.debug) {
                    ctx.lineWidth = 5;
                    ctx.strokeStyle="yellow";
                    ctx.strokeRect(loc[0], loc[1], loc[2], loc[3]);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle="red";
                    ctx.moveTo(textanchor, loc[1]);
                    ctx.lineTo(textanchor,parseInt(loc[1])+parseInt(loc[3]));
                    ctx.stroke();
                }
           
    },

    arrayMaker: function(mytext) {
        return mytext.split('\n');
    }
}
