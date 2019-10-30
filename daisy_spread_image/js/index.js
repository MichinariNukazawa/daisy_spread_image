'use strict';

const fs = require("fs");
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
let SVG = require('svg.js');
//const {app} = require('electron').remote;
const Renderer = require('./js/renderer').Renderer;
const RenderingHandle = require('./js/renderer').RenderingHandle;
const DaisyIO = require('./js/daisy-io');
const ExternalBrowser = require('./js/external_browser');
let ad = new Ad();

let rendering_handle = null;
let rendering_handle_thumbnail = null;



// 再現可能擬似乱数
//! @notice 再現さえできればよく、かつ機能追加などであっさり呼び出しが増減するのでバージョン間の再現は諦める。
// https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/
class Random {
	constructor(seed = 88675123) {
		this.x = 123456789;
		this.y = 362436069;
		this.z = 521288629;
		this.w = seed;
	}

	// XorShift
	next() {
		let t;

		t = this.x ^ (this.x << 11);
		this.x = this.y; this.y = this.z; this.z = this.w;
		return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8)); 
	}

	range(min, max){
		const v = Math.abs(this.next());
		const n = max - min;
		const r = (v % n) + min;
		return r;
	}
}

class Point{
	static between_s(p0, p1){
		return Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y);
	}
}



function isExistDirSync(file)
{
	try{
		const stat = fs.statSync(file);
		return stat.isDirectory();
	}catch(err){
		return false;
	}
}

function opendir_dialog(default_dirpath)
{
	const {app} = require('electron').remote;
	const {dialog} = require('electron').remote;
	const fs = require('fs');

	let open_dirpath = app.getPath('home');
	if(isExistDirSync(default_dirpath)){
		open_dirpath = default_dirpath;
	}
	console.debug('open_dirpath', open_dirpath);

	let filepath = dialog.showOpenDialogSync(
			remote.getCurrentWindow(),
			{
				title: 'Open',
				defaultPath: open_dirpath,
				properties: ['openDirectory'],
			});

	if(typeof filepath === "undefined"){
		return '';
	}

	filepath = filepath[0];
	return filepath;
}



function add_event_listener_from_property(property, callback_){
	Object.keys(property).forEach(function (key) {
		console.debug(key, property[key]);

		const property_name = key;
		const value = property[key];
		let element = document.getElementById('editor-' + property_name);
		if(! element){
			console.warn("bug or not implement", property_name); // not implement 'magickcircle_dirpath'
			return; // == continue;
		}
		switch(element.type){
			case 'checkbox':
				element.addEventListener('click', callback_, false);
				break;
			default:
				element.addEventListener('change', callback_, false);
		}
	});
}

function set_ui_from_property(property){
	Object.keys(property).forEach(function (key) {
		console.debug(key, property[key]);

		const property_name = key;
		const value = property[key];
		let element = document.getElementById('editor-' + property_name);
		if(! element){
			console.error("bug");
			return; // == continue;
		}
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

	property.magickcircle_dirpath = get_circle_dirpath();

	property.canvas_scale_par		= document.getElementById('editor-canvas_scale_par').value;
	property.document_width			= document.getElementById('editor-document_width').value;
	property.document_height		= document.getElementById('editor-document_height').value;
	property.randomseed_value		= document.getElementById('editor-randomseed_value').value;
	property.magickcircle_num		= document.getElementById('editor-magickcircle_num').value;
	property.magickcircle_source_kind	= document.getElementById('editor-magickcircle_source_kind').value;
	property.magickcircle_source_directory_path	= document.getElementById('editor-magickcircle_source_directory_path').value;
	property.magickcircle_unique_picking	= document.getElementById('editor-magickcircle_unique_picking').checked;
	property.magickcircle_not_collision	= document.getElementById('editor-magickcircle_not_collision').checked;
	property.magickcircle_imagescale	= document.getElementById('editor-magickcircle_imagescale').value;
	property.magickcircle_randomsize	= document.getElementById('editor-magickcircle_randomsize').checked;
	property.magickcircle_randomrotate	= document.getElementById('editor-magickcircle_randomrotate').checked;
	property.magickcircle_randomskew	= document.getElementById('editor-magickcircle_randomskew').checked;
	property.magickcircle_skewdegree	= document.getElementById('editor-magickcircle_skewdegree').value;

	return property;
}

function read_circle_filepaths_from_dirpath(dirpath){
	let a = fs.readdirSync(dirpath);
	console.debug(a);
	return a.filter(name => /.svg$/.test(name));
}

function get_circle_dirpath(){
	const fileex = require('./js/fileex');
	return fileex.join(__dirname, "resource/circle/");
}

function generate_position_not_collision(random, position_range, elem_scale, diagram_elements){
	for(let i = 0; i < 400; i++){
		let position = {
			"x": random.range(position_range.min.x, position_range.max.x),
			"y": random.range(position_range.min.y, position_range.max.y),
		};

		let is_collision = false;
		for(let eix = 0; eix < diagram_elements.length; eix++){
			// @todo magickcircle自体の元サイズに関わらず左上基準位置の距離だけ見ている
			const col = 1600;
			const bet = (col / 2 * diagram_elements[eix].scale) + (col / 2 * elem_scale);
			if(bet > Point.between_s(position, diagram_elements[eix])){
				is_collision = true;
				break;
			}
		}
		if(! is_collision){ // 衝突していなければそれを返す
			return position;
		}
	}

	return null;
}

function set_ui_generate_diagram(diagram){
	const fileex = require('./js/fileex');
	const property = diagram.property;
	console.log("prop:", property);

	let dirpath = get_circle_dirpath();
	if('BuiltIn' !== property.magickcircle_source_kind){
		if(! isExistDirSync(property.magickcircle_source_directory_path)){
			// use faullback to BuiltIn
			console.log('use faullback to BuiltIn', property.magickcircle_source_directory_path);
			if('' !== property.magickcircle_source_directory_path){
				alert(sprintf("directory not exist:¥n`%s`", property.magickcircle_source_directory_path));
			}
		}else{
			dirpath = property.magickcircle_source_directory_path;
		}
	}
	property.magickcircle_dirpath = dirpath;

	let circle_filepaths = read_circle_filepaths_from_dirpath(dirpath);
	document.getElementById('magickcircle_source_num').textContent = sprintf("%3d", circle_filepaths.length);

	let random = new Random(parseInt(diagram.property.randomseed_value, 10));

	const position_range = {
		"min": {"x": 0, "y": 0},
		"max": {
			"x": diagram.property.document_width  - (1000 * diagram.property.magickcircle_imagescale),
			"y": diagram.property.document_height - (1000 * diagram.property.magickcircle_imagescale)
		},
	};

	diagram.diagram_elements = [];
	for(let i = 0; i < property.magickcircle_num; i++){
		const ix = random.range(0, circle_filepaths.length);

		if(0 === circle_filepaths.length){
			alert("empty magickcircle (or full unique)");
			break;
		}

		// randomrotate無効にした場合に位置他が変わらないよう乱数を取ってから消す。
		let rotate_degree = random.range(0, 360);
		if(! diagram.property.magickcircle_randomrotate){
			rotate_degree = 0;
		}
		let scale = random.range(5, 15);
		if(! diagram.property.magickcircle_randomsize){
			scale = 10.0;
		}
		scale = scale / 10.0;
		scale *= diagram.property.magickcircle_imagescale;

		let circle_subfilepath = circle_filepaths[ix];
		if(diagram.property.magickcircle_unique_picking){
			circle_filepaths.splice(ix, 1);
		}
		console.debug(i, circle_subfilepath);

		let position;
		if(! diagram.property.magickcircle_not_collision){
			position = {
				"x": random.range(position_range.min.x, position_range.max.x),
				"y": random.range(position_range.min.y, position_range.max.y),
			};
		}else{
			position = generate_position_not_collision(random, position_range, scale, diagram.diagram_elements);
			if(null == position){
				alert("position collision. document full.");
				break;
			}
		}

		let elem = {
			"kind": "circle_svg",
			"x": position.x,
			"y": position.y,
			"scale": scale,
			"rotate_degree": rotate_degree,
			"skew": { 'x': 0, 'y': 0,},
			"subfilepath": circle_subfilepath
		};
		diagram.diagram_elements.push(elem);
	}

	for(let i = 0; i < diagram.diagram_elements.length; i++){
		let elem = diagram.diagram_elements[i];

		if(diagram.property.magickcircle_randomskew){
			const skew_v = diagram.property.magickcircle_skewdegree; //20;
			const skew = {
				'x': random.range(-100, 100) / 100.0 * skew_v,
				'y': random.range(-100, 100) / 100.0 * skew_v,
			};

			elem.skew = skew;
		}
	}

	Renderer.rerendering(rendering_handle, diagram, null, null, null);
	Renderer.rendering_thumbnail(rendering_handle_thumbnail, rendering_handle, {'x': 300,'y': 150});
}

function rerendering(){
		const property = get_property_from_ui();

		console.debug("get prop", property);
		get_doc().diagram.property = property;

		set_ui_generate_diagram(get_doc().diagram);
}

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

let global_doc = null;
function get_doc(){
	return global_doc;
}

window.addEventListener("load", function(){
	console.debug("wakeup");

	// doc init
	const fileex = require('./js/fileex');
	const filepathDefaultDoc = fileex.join(__dirname, "resource/default-document.daisyspreadimage");
	global_doc = fileex.read_json(filepathDefaultDoc);
	console.debug(global_doc);

	set_ui_from_property(get_doc().diagram.property);

	rendering_handle = new RenderingHandle('canvas');
	rendering_handle_thumbnail = new RenderingHandle('thumbnail-canvas');

	set_ui_generate_diagram(get_doc().diagram);

	// ** eventListener
	document.getElementById('generate-randomseed').addEventListener('click', function(e){
		document.getElementById('editor-randomseed_value').value = getRandomInt(0, 65532);

		rerendering();
	}, false);
	document.getElementById('editor-magickcircle_source_kind').addEventListener('change', function(e){
		console.log("kind:", e.target.value);
		let elem_pathinput = document.getElementById('editor-magickcircle_source_directory_path');
		let elem_pathbutton = document.getElementById('opendir-magickcircle_source_directory_path');
		switch(e.target.value){
			case "BuiltIn":
				elem_pathinput.disabled = true;
				elem_pathbutton.disabled = true;
				break;
			default:
				elem_pathinput.disabled = false;
				elem_pathbutton.disabled = false;
		}
	}, false);
	document.getElementById('opendir-magickcircle_source_directory_path').addEventListener('click', function(e){
		let elem_dirpath = document.getElementById('editor-magickcircle_source_directory_path');
		let dirpath = elem_dirpath.value;
		dirpath = opendir_dialog(dirpath);
		console.log("dirpath", dirpath);
		elem_dirpath.value = dirpath;

		rerendering();
	}, false);
	document.getElementById('link-get-more-magickcircle').addEventListener('click', function(e){
		ExternalBrowser.open('https://daisy-bell.booth.pm/items/81865');
	}, false);

	// **
	let callback_editor_change_ = function(e){
		console.debug(e.target);

		rerendering();
	};
	add_event_listener_from_property(get_doc().diagram.property, callback_editor_change_);

	ad.start();
});

