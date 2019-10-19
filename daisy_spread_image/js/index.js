'use strict';

const fs = require("fs");
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
let SVG = require('svg.js');

/*
const {app} = require('electron').remote;
const sprintf = require('sprintf-js').sprintf;
*/



function set_ui_from_property(property){
	Object.keys(property).forEach(function (key) {
		console.log(key, property[key]);
		const property_name = key;
		const value = property[key];
		let element = document.getElementById('editor-' + property_name);
		switch(element.type){
			case 'checkbox':
				element.checked = value;
				break;
			default:
				element.value = value;
		}

		let view = document.getElementById('editor-' + property_name + '-view');
		if(view){
			view.textContent = '(' + sprintf("%3d", value) + '%)';
		}
	});
}

function read_curcle_filepaths_from_dirpath(dirpath){
	let a = fs.readdirSync(dirpath);
	console.log(a);
	return a.filter(name => /.svg$/.test(name));
}

function get_curcle_dirpath(){
	const fileex = require('./js/fileex');
	return fileex.join(__dirname, "resource/circle/");
}

function read_curcle_filepaths(){
	const fileex = require('./js/fileex');

	const dirpath = get_curcle_dirpath();
	return read_curcle_filepaths_from_dirpath(dirpath);
}

function set_ui_generate_diagram(property){
	const fileex = require('./js/fileex');

	let curcle_filepaths = read_curcle_filepaths();
	console.log(curcle_filepaths);

	const elemId = 'canvas';
	//const elemId = 'target-image';
	let svg = SVG(elemId).size(property.document_width, property.document_height);
	svg.clear();
	let diagram_group = svg.group().addClass('diagram_group');
	diagram_group.scale(0.1, 0.1);

	for(let i = 0; i < property.magickcircle_num; i++){
		const dirpath = get_curcle_dirpath();
		const filepath = path.join(dirpath, curcle_filepaths[i]);
		let circleimage_svg = fs.readFileSync(filepath, 'utf8');
		let diagram_group_ = diagram_group.group().addClass('group__AA');
		diagram_group_.svg(circleimage_svg)
				//.move((i * 1000) - 500, (i * 1000) - 500)
				.move((i * 1000 / 2), (i * 1000 / 1))
				//.scale(1.0, 1.0)
				.attr({
					'opacity':	1.0,
				});

		console.log(i, filepath);
	}
}

window.addEventListener("load", function(){
	console.log("wakeup");

	const fileex = require('./js/fileex');
	const filepathDefaultDoc = fileex.join(__dirname, "resource/default-document.daisyspreadimage");
	const doc = fileex.read_json(filepathDefaultDoc);
	console.log(doc);

	const property = doc.diagram.property;
	set_ui_from_property(property);

	set_ui_generate_diagram(property);

	document.getElementById('thumbnail-frame').style.display = "none";
	/*
	let src = document.getElementById('canvas');
	//let src = document.getElementById('target-image');
	let dst = src.cloneNode(true);
	let target = document.getElementById('thumbnail');
	target.appendChild(dst);
	src.width = 600;
	dst.height = "300px";

	console.log(dst.childNodes);
	dst.childNodes.forEach(function(node){
		console.log(/^Svg/i.test(node.id));
		console.log(node.type, node.nodeType, node.id, node);
		//const src_height = node.getAttribute("height");
		if(/^Svg/i.test(node.id)){
			//node.style.height = "300px";
			//node.height = 300;
			//node.width = 300;
			//const src_height = parseInt(node["height"]);
			const src_height = parseInt(node.getAttribute("height"), 10);
			const scale = 300 / src_height;
			node.setAttribute("height", 300);
			//node.setAttribute("transform", "scale(" + scale + ")");
			node.setAttribute("style", "transform:scale(" + scale + "); transform:translate(-5000, -5000);");
		}
	});
	*/
});

