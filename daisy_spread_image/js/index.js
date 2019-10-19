'use strict';

const fs = require("fs");
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
let SVG = require('svg.js');
const Renderer = require('./js/renderer').Renderer;
const RenderingHandle = require('./js/renderer').RenderingHandle;
//const {app} = require('electron').remote;

let rendering_handle = null;



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
		//console.log("Random.range:", min,max, v, n, r);
		return r;
	}
}



function set_ui_from_property(property){
	Object.keys(property).forEach(function (key) {
		console.debug(key, property[key]);
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
}

function read_curcle_filepaths_from_dirpath(dirpath){
	let a = fs.readdirSync(dirpath);
	console.debug(a);
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
	console.debug(curcle_filepaths);

	const dirpath = get_curcle_dirpath();
	property.magickcircle_dirpath = dirpath;

	let random = new Random(parseInt(diagram.property.randomseed_value, 10));

	// @todo 拡大縮小とデフォルト画像サイズをハードコートしている
	const position_range = {
		"min": {"x": 0, "y": 0},
		"max": {"x": ((diagram.property.document_width / 0.1) - 1000), "y": ((diagram.property.document_height / 0.1) - 1000)},
	};

	diagram.diagram_elements = [];
	for(let i = 0; i < property.magickcircle_num; i++){
		const ix = random.range(0, curcle_filepaths.length);

		// randomrotate無効にした場合に位置他が変わらないよう乱数を取ってから消す。
		let rotate_degree = random.range(0, 360);
		if(! diagram.property.magickcircle_randomrotate){
			rotate_degree = 0;
		}
		let scale = random.range(2, 10);
		if(! diagram.property.magickcircle_randomsize){
			scale = 10.0;
		}
		scale = scale / 10.0;

		let circle_subfilepath = curcle_filepaths[ix];
		let elem = {
			"kind": "circle_svg",
			"x": random.range(position_range.min.x, position_range.max.x),
			"y": random.range(position_range.min.y, position_range.max.y),
			"scale": scale,
			"rotate_degree": rotate_degree,
			"subfilepath": circle_subfilepath
		};
		diagram.diagram_elements.push(elem);

		console.debug(i, circle_subfilepath);
	}

	Renderer.rerendering(rendering_handle, diagram, null, null, null);

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

	set_ui_generate_diagram(get_doc().diagram);

	document.getElementById('thumbnail-frame').style.display = "none";

	document.getElementById('apply-button').addEventListener('click', function(e){
		rerendering();
	}, false);

	document.getElementById('generate-randomseed').addEventListener('click', function(e){
		document.getElementById('editor-randomseed_value').value = getRandomInt(0, 65532);

		rerendering();
	}, false);
});

