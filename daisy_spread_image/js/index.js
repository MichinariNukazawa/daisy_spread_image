'use strict';

const fs = require("fs");
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
let SVG = require('svg.js');
const Renderer = require('./js/renderer').Renderer;
const RenderingHandle = require('./js/renderer').RenderingHandle;
/*
const {app} = require('electron').remote;
const sprintf = require('sprintf-js').sprintf;
*/

let rendering_handle = null;



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

function get_property_from_ui(){
	let property = {};

	property.magickcircle_dirpath = get_curcle_dirpath();

	property.document_width			= document.getElementById('editor-document_width').value;
	property.document_height		= document.getElementById('editor-document_height').value;
	property.randomseed_value		= document.getElementById('editor-randomseed_value').value;
	property.magickcircle_num		= document.getElementById('editor-magickcircle_num').value;
	property.magickcircle_randomsize	= document.getElementById('editor-magickcircle_randomsize').checked;
	property.magickcircle_randomrotate	= document.getElementById('editor-magickcircle_randomrotate').checked;
	property.magickcircle_transparent	= document.getElementById('editor-magickcircle_transparent').value;

	return property;

	/*
	console.log(document.getElementsByTagName("input"));
	let inputs = document.getElementsByTagName("input")
	inputs.forEach(function(input){
		if(! input.id.startWith('editor-')){
			continue;
		}
		property[key] = input.value
	});
	*/
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

function set_ui_generate_diagram(diagram){
	const fileex = require('./js/fileex');
	const property = diagram.property;

	let curcle_filepaths = read_curcle_filepaths();
	console.log(curcle_filepaths);

	/*

	const elemId = 'canvas';
	//const elemId = 'target-image';
	let svg = SVG(elemId).size(property.document_width, property.document_height);
	svg.clear();
	let diagram_group = svg.group().addClass('diagram_group');
	diagram_group.scale(0.1, 0.1);
*/

	const dirpath = get_curcle_dirpath();
	property.magickcircle_dirpath = dirpath;

	diagram.diagram_elements = [];
	for(let i = 0; i < property.magickcircle_num; i++){
		let circle_subfilepath = curcle_filepaths[i];
		let elem = {
			"kind": "circle_svg",
			"x": (i * 1000 / 2),
			"y": (i * 1000 / 1),
			"subfilepath": circle_subfilepath
		};
		diagram.diagram_elements.push(elem);

		console.log(i, circle_subfilepath);
	}

	Renderer.rerendering(rendering_handle, diagram, null, null, null);

/*
	Renderer.rerendering(
		rendering_handle,
		daisy.get_current_diagram(),
		Doc.get_focus(daisy.get_current_doc()),
		mouse_state,
		tool.get_tool_kind());
*/
}

let global_doc = null;
function get_doc(){
	return global_doc;
}

window.addEventListener("load", function(){
	console.log("wakeup");

	// doc init
	const fileex = require('./js/fileex');
	const filepathDefaultDoc = fileex.join(__dirname, "resource/default-document.daisyspreadimage");
	global_doc = fileex.read_json(filepathDefaultDoc);
	console.log(global_doc);

	set_ui_from_property(get_doc().diagram.property);

	rendering_handle = new RenderingHandle('canvas');

	set_ui_generate_diagram(get_doc().diagram);

	document.getElementById('thumbnail-frame').style.display = "none";

	document.getElementById('apply-button').addEventListener('click', function(e){
		const property = get_property_from_ui();

		console.log("get prop", property);
		get_doc().diagram.property = property;

		set_ui_generate_diagram(get_doc().diagram);
	}, false);
});

