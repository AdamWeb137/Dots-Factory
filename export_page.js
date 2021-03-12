
var img_div = document.getElementById("imgs");
var btn = document.getElementById("print");


function resize(){
    var img_children = img_div.children;
    for(var i = 0; i < img_children.length; i++){
        img_children[i].style.width = `${window.innerWidth-60}px`;
        img_children[i].style.height = `${(window.innerWidth-60)*11/8.5}px`;
    }
}

window.onload = function(){
    resize();
}


window.onresize = function(){
    resize();
}

window.onbeforeprint = function(){
    btn.style.display = "none";
}

window.onafterprint = function(){
    btn.style.display = "block";
}