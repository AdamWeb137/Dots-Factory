
var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");

var mouse_on_canv = false;

canvas.addEventListener("mouseenter", () => {
    mouse_on_canv = true;
});

canvas.addEventListener("mouseleave", () => {
    mouse_on_canv = false;
});

var pg_width = 85;
var pg_height = 110;

var page_number = 0;

var rendering = false;
var pages_rendered = [];
var numbers_rendered = new Set();

var render_i = 0;
var render_interval = null;

var default_page = {
    "settings":{
        "zoom":4,
        "color":"#ffffff"
    },
    "image":null,
    "text":[],
    "dots":[]
}

var pages = [
    {
        "settings":{
            "zoom":4,
            "color":"#ffffff",
        },
        "image":null,
        "text":[],
        "dots":[]
    }
];


var mode = "settings";
var sel_point = -1;

var loaded_image = null;

function update_with_image(){

    var cur_page = pages[page_number];

    var new_width = cur_page.settings.zoom*pg_width;
    var new_height = cur_page.settings.zoom*pg_height;

    canvas.style.width = `${new_width}px`;
    canvas.style.height = `${new_height}px`;

    canvas.width = new_width;
    canvas.height = new_height;

    ctx.width = new_width;
    ctx.height = new_height;

    var tmp_img = null;

    if(cur_page.image != null){

        if(loaded_image != null){
            if(loaded_image.src == cur_page.image.src){
                update_canvas(loaded_image, new_width, new_height);
            }
        }

        tmp_img = new Image(cur_page.image.width*cur_page.settings.zoom/4,cur_page.image.width*cur_page.settings.zoom/4);
        tmp_img.src = cur_page.image.src;
        tmp_img.style.width = `${cur_page.image.width*cur_page.settings.zoom/4}px`;
        tmp_img.style.height = `${cur_page.image.width*cur_page.settings.zoom/4}px`;

        tmp_img.onload = function(){
            loaded_image = tmp_img;
            update_canvas(tmp_img, new_width, new_height);
        }

    }else{
        update_canvas(null, new_width, new_height);
    }


}

function get_z_percent(){
    return pages[page_number].settings.zoom/4;
}

function get_cur_page(){
    return pages[page_number];
}

function componentToHex(c) {
    var hex = c.toString(16);
    if(hex.length == 1){
        hex = "0" + hex;
    }
    return hex;
}

function rgb_to_hex(r,g,b){
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function update_canvas(tmp_img, w, h){
    var cur_page = pages[page_number];

    var new_width = w;
    var new_height = h;

    var zoom = cur_page.settings.zoom;
    var z_percent = zoom/4;

    ctx.fillStyle = cur_page.settings.color;

    ctx.fillRect(0,0,new_width,new_height);


    if(tmp_img != null){
        ctx.drawImage(tmp_img, cur_page.image.x*z_percent, cur_page.image.y*z_percent, cur_page.image.width*z_percent,cur_page.image.height*z_percent);
    }

    for(var i = 0; i < cur_page.text.length; i++){
        var t = cur_page.text[i];

        ctx.font = `${Math.floor(t.size*z_percent)}px ${t.font}`;

        ctx.fillStyle = t.color;

        ctx.fillText(t.text, t.x*z_percent, (t.y)*z_percent);

    }

    for(var i = 0; i < cur_page.dots.length; i++){
        var dot = cur_page.dots[i];

        var x = dot[0];
        var y = dot[1];

        var d_size = Math.floor(4*z_percent);

        ctx.fillStyle = rgb_to_hex(255-Math.floor(255*(i+1)/(cur_page.dots.length)),0,0);//"#000000";
        ctx.fillRect(Math.floor(x)*z_percent-d_size/2,Math.floor(y)*z_percent-d_size/2,d_size,d_size);

        ctx.font = `${Math.floor(6*z_percent)}px Arial`;

        ctx.fillText(String(i+1), (x*z_percent+d_size/2 + 3*z_percent), (y*z_percent+d_size/2 + 3*z_percent));

        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#000000";

        if(i > 0 && i < cur_page.dots.length && mode == "point"){
            ctx.beginPath();
            ctx.moveTo((cur_page.dots[i-1][0])*z_percent, (cur_page.dots[i-1][1])*z_percent);
            ctx.lineTo(x*z_percent,y*z_percent);
            ctx.stroke();
        }

    }

    if(rendering){
        

        if(!numbers_rendered.has(page_number)){


            numbers_rendered.add(page_number);
            pages_rendered.push(canvas.toDataURL());

            if(render_i >= pages.length-1){

                rendering = false;
                clearInterval(render_interval);
                render_interval = null;

                export_page();


                for(var i = 0; i < pages.length; i++){
                    pages[i].settings.zoom = 4;
                }

                page_number = 0;
                change_mode("page");


            }
        }

    }
}

update_with_image();


function getMousePosition(e){

    //copied from stack overflow lol

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return [x,y];
}

function getMouseWithRotations(e){

    var xy = getMousePosition(e);

    if(canvas.style.transform == "rotate(90deg)"){
        return [xy[1],xy[0]]
    }

    return xy
}

canvas.addEventListener("mousemove", (e) => {
    if(mode == "point" && mouse_on_canv){

        var cur_page = get_cur_page();

        update_with_image();

        // get x and y positions of mouse

        var xy = getMousePosition(e);
        var x = xy[0];
        var y = xy[1];

        ctx.fillStyle = "#ff0000";
        ctx.strokeStyle = "#000000";

        var z_percent = get_z_percent();

        var d_size = Math.floor(4*z_percent);
        ctx.fillRect(x,y,d_size,d_size);
        ctx.font = `${Math.floor(6*z_percent)}px Arial`;
        ctx.fillText(String(sel_point+2), (x+d_size/2 + 3*z_percent), (y+d_size/2 + 3*z_percent));

        if(sel_point > -1){
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(cur_page.dots[sel_point][0]*z_percent, cur_page.dots[sel_point][1]*z_percent);
            ctx.lineTo(x,y);
            ctx.stroke();
        }

        if(sel_point < cur_page.dots.length-1){
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.lineTo(cur_page.dots[sel_point+1][0]*z_percent, cur_page.dots[sel_point+1][1]*z_percent);
            ctx.stroke();
        }
    }
});

canvas.addEventListener("mouseup", (e)=>{
    if(e.button == 0 && mode == "point" && mouse_on_canv){
        var cur_page = get_cur_page();
        var xy = getMousePosition(e);        
        var z_percent = get_z_percent();

        var realx = xy[0]/z_percent;
        var realy = xy[1]/z_percent;

        cur_page.dots.splice(sel_point+1, 0, [realx,realy]);
        sel_point = cur_page.dots.length-1;

    }

    if(e.button == 0 && mode == "text" && mouse_on_canv){

        var font = document.getElementById("text_font").value;
        var text = document.getElementById("text_text").value;

        if(text.length > 0){

            var color = document.getElementById("text_color").value;
            var size = document.getElementById("text_size").value;

            var xy = getMousePosition(e);

            var txt = {
                "text":text,
                "font":font,
                "size":size,
                "color":color,
                "x":Math.floor(xy[0]/get_z_percent()),
                "y":Math.floor(xy[1]/get_z_percent())
            };

            get_cur_page().text.push(txt);
        }
    }

    update_with_image();
});

function change_point(d){
    if(mode == "point"){
        sel_point += d;

        if(sel_point < -1){
            sel_point = -1;
        }

        if(sel_point > get_cur_page().dots.length-1){
            sel_point = get_cur_page().dots.length-1;
        }

        update_with_image();
    }
}

function delete_point(){
    if(mode == "point"){
        if(get_cur_page().dots.length > 0){
            get_cur_page().dots.splice(sel_point,1);
            sel_point -= 1;
        }
        update_with_image();
    }
}

function window_keyup(e){
    if(e.keyCode == 65){
        //A
        change_point(-1);
    }else if(e.keyCode == 68){
        //D
        change_point(1);
    }else if(e.keyCode == 8){
        //Backspace
        delete_point();
    }else if(e.keyCode == 219){
        //[
        get_cur_page().settings.zoom = Math.max(3,get_cur_page().settings.zoom-1);
        document.getElementById("page_zoom").value = get_cur_page().settings.zoom;
    }else if(e.keyCode == 221){
        //]
        get_cur_page().settings.zoom += 1;
        document.getElementById("page_zoom").value = get_cur_page().settings.zoom;
    }else if(e.keyCode == 37){
        change_page(-1);
    }else if(e.keyCode == 39){
        change_page(1);
    }

    // if(e.keyCode == 78){
    //     change_mode("page");
    // }else if(e.keyCode == 77){
    //     change_mode("point");
    // }else if(e.keyCode == 188){
    //     change_mode("img");
    // }else if(e.keyCode == 190){
    //     change_mode("text");
    // }

    update_with_image();
}

function window_keypress(e){
    if(mode == "img"){
        if(e.keyCode == 97){
            document.getElementById("img_x").value = -3+Number(document.getElementById("img_x").value);
        }

        if(e.keyCode == 100){
            document.getElementById("img_x").value = 3+Number(document.getElementById("img_x").value);
        }

        if(e.keyCode == 115){
            document.getElementById("img_y").value = 3+Number(document.getElementById("img_y").value);
        }

        if(e.keyCode == 119){
            document.getElementById("img_y").value = -3+Number(document.getElementById("img_y").value);
        }
    }
    change_img();
}

window.addEventListener("keypress", window_keypress);

window.addEventListener("keyup", window_keyup);

function change_mode(nm){
    mode = nm;

    var setting_buttons = document.getElementsByClassName("mode_change");
    for(var i = 0; i < setting_buttons.length; i++){
        setting_buttons[i].classList.remove("selected_mode");
    }

    document.getElementById("btn_"+mode).classList.add("selected_mode");


    var setting_divs = document.getElementsByClassName("settings");
    for(var i = 0; i < setting_divs.length; i++){
        setting_divs[i].style.display = "none";
    }

    var mode_div = document.getElementById(mode);
    mode_div.style.display = "block";

    var cur_page = get_cur_page();

    if(mode == "page"){
        document.getElementById("page_zoom").value = cur_page.settings.zoom;
        document.getElementById("page_color").value = cur_page.settings.color;

        if(pages.length > 1){
            document.getElementById("move_page").style.display = "block";

            if(page_number == 0){
                document.getElementById("page_left").style.display = "none";
            }else{
                document.getElementById("page_left").style.display = "inline-block";
            }

            if(page_number == pages.length-1){
                document.getElementById("page_right").style.display = "none";
            }else{
                document.getElementById("page_right").style.display = "inline-block";
            }

        }else{
            document.getElementById("move_page").style.display = "none";
        }

    }

    document.getElementById("number_indicator").innerText = `Page ${page_number+1}/${pages.length}`;
    sel_point = get_cur_page().dots.length-1;

    update_with_image();
}

function change_zoom(){
    var zoom_el = document.getElementById("page_zoom");
    var cur_page = get_cur_page();

    cur_page.settings.zoom = Number(zoom_el.value);

    update_with_image();

}

function change_page_color(){
    var n_col = document.getElementById("page_color").value;
    get_cur_page().settings.color = n_col;
    update_with_image();
}

function insert_page(i){

    var oldzoom = get_cur_page().settings.zoom;

    pages.splice(i, 0, JSON.parse(JSON.stringify(default_page)));
    page_number = i;

    get_cur_page().settings.zoom = oldzoom;


    change_mode("page");
}

function change_page(d){
    var ni = page_number+d;
    if(ni < 0){
        ni = 0;
    }

    if(ni > pages.length-1){
        ni = pages.length-1;
    }

    page_number = ni;

    change_mode("page");

}

function delete_page(){
    if(confirm("Are you sure you want to delete this page forever?")){
        pages.splice(page_number,1);

        page_number = Math.max(0,page_number-1);

        if(pages.length == 0){
            pages.push(JSON.parse(JSON.stringify(default_page)));
        }

        change_mode("page");
    }
}

change_mode("page");

var freader = new FileReader();
var load_freader = new FileReader();

function new_image(){
    var img_file = document.getElementById("img_file");
    if(img_file.files.length > 0){
        freader.readAsDataURL(img_file.files[0])
    }
}

freader.onloadend = function(){
    var img = freader.result;
    get_cur_page().image = {
        "src":img,
        "width":document.getElementById("img_width").value,
        "height":document.getElementById("img_height").value,
        "x":document.getElementById("img_x").value,
        "y":document.getElementById("img_y").value
    };

    update_with_image();
}

function change_img(){

    var x = document.getElementById("img_x");
    var y = document.getElementById("img_y");

    var width = document.getElementById("img_width");
    var height = document.getElementById("img_width");

    if(mode == "img" && get_cur_page().image != null){
        get_cur_page().image.x = x.value;
        get_cur_page().image.y = y.value;
        get_cur_page().image.width = width.value;
        get_cur_page().image.height = height.value;
    }

    update_with_image();
}

function delete_img(){
    if(mode == "img"){
        if(get_cur_page().image != null){
            if(confirm("Are you sure you want to delete this image?")){
                get_cur_page().image = null;
                update_with_image();
            }
        }
    }
}

function delete_text(){
    if(mode == "text"){
        if(get_cur_page().text.length > 0){
            get_cur_page().text.splice(get_cur_page().text.length-1,1);
            update_with_image();
        }
    }
}

function save_file(){

    var name = prompt("Please enter a file name: ", "connect_dots");
    var saveblob = new Blob([JSON.stringify(pages)], {type : 'application/json'});

    var tmpa = document.createElement("a");
    tmpa.href = URL.createObjectURL(saveblob);
    tmpa.download = name;

    tmpa.click();
    tmpa.remove();

}

function load_file(){
            
    if(!confirm("Are you sure you want to load? Any unsaved pages will be lost.")){
        return;
    }


    var new_file_input = document.createElement("input");
    new_file_input.type = "file";
    new_file_input.accept = "application/json";

    new_file_input.onchange = function(){
        if(new_file_input.files.length > 0){
            var name_split = new_file_input.files[0].name.split(".");
            if(name_split[name_split.length - 1] == "json" || name_split[name_split.length - 1] == "JSON"){
                load_freader.readAsText(new_file_input.files[0]);
            }
        }
    }

    new_file_input.click();

}

load_freader.onloadend = function(){
    var pgs = load_freader.result;
    try {
        var json_contents = JSON.parse(pgs);

        pages = json_contents;
        page_number = 0;
        sel_point = -1;

        change_mode("page");

    }catch (e) {
        alert("Save file curropted");
    }
}

function export_file()  
{

    page_number = 0;

    change_mode("page");

    rendering = true;
    render_i = 0;
    numbers_rendered = new Set();
    pages_rendered = [];

    render_interval = setInterval(function(){

        if(rendering && render_i < pages.length){

            page_number = render_i;

            get_cur_page().settings.zoom = 8;

            update_with_image();
            render_i += 1;

        }

    }, 300);
}

function save_image(){
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            
    var tmp_a = document.createElement("a");
    tmp_a.download = "page_"+String(page_number+1)+".png";
    tmp_a.href = image;
    tmp_a.click();
    tmp_a.remove();

}

function export_page(){
    var imgs = "";

    for(var i = 0; i < pages_rendered.length; i++){
        imgs = imgs + `<img src="${pages_rendered[i]}">`;
    }

    var win_content = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Export Connect the Dots</title>
                <style>

                body {
                    margin: 0px 0px 0px 0px;
                    max-width:1275px;
                }

                #imgs {
                    padding: 0px 0px 0px 0px;
                    width:calc(100% - 60px);
                    margin-left:auto;
                    margin-right:auto;
                }

                #print {
                    margin-top:5px;
                    margin-bottom:5px;
                }

                img {
                    max-width:1275px;
                }


                </style>
            </head>
            <body>
                <center><button id="print" onmouseup="window.print()">Print / Save</button></center>
                <div id="imgs">${imgs}</div>
                <script type="text/javascript" src="C:/Users/wooda/Desktop/Programming/Html/DotsFactory/export_page.js"></script>
            </body>
        </html>
    `;

    var new_win = window.open('','','width=1275');
    new_win.document.open();
    new_win.document.write(win_content);
    new_win.document.close();

}