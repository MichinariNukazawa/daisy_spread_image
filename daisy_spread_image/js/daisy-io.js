'use strict';

const sprintf = require('sprintf-js').sprintf;
const fs = require("fs");

module.exports = class DaisyIO{
	static set_err_(err_, level, label, message)
	{
		err_.level = level;
		err_.label = label;
		err_.message = message;
	}

	static add_errs_(errs_, level, label, message)
	{
		let err_ = {};
		DaisyIO.set_err_(err_, level, label, message);

		if(! Array.isArray(errs_)){
			console.error(errs_);
			errs_ = [];
		}
		errs_.push(err_);
	}

	static open_diagram_from_path(filepath, errs_)
	{
//		const Diagram = require('./diagram');

		if(typeof filepath !== 'string'){
			DaisyIO.add_errs_(errs_, 'bug', "Open", "not filepath.");
			return null;
		}

		let strdata = '';
		try{
			strdata = fs.readFileSync(filepath, 'utf-8');
		}catch(err){
			console.error(err.message);
			DaisyIO.add_errs_(errs_, 'warning', "Open", err.message);
			return null;
		}

		const diagram = Diagram.create_from_native_format_string(strdata, errs_);
		return diagram;
	}

	static get_ext_from_filepath(filepath)
	{
		const m = filepath.match(/\.[a-zA-Z0-9]*$/);
		if(null === m){
			return '';
		}
		return m[0];
	}

	static write_export_diagram(filepath, diagram, errs_)
	{
		// 周辺情報: 0x0pxのSVGを開くとeye of gnomeが読み込みエラーを起こす。

		if(typeof filepath !== 'string'){
			DaisyIO.add_errs_(errs_, 'bug', "Export", "not filepath.");
			return null;
		}

		const ext = DaisyIO.get_ext_from_filepath(filepath);

		let res;
		switch(ext){
			case '.png':
				res = DaisyIO.write_export_png_from_diagram_(filepath, diagram, errs_);
				break;
			case '.svg':
				res = DaisyIO.write_export_svg_from_diagram_(filepath, diagram, errs_);
				break;
			case '':
				DaisyIO.add_errs_(errs_, "warning", "Export", sprintf("file type (ext) not exist. :`%s`", filepath));
				return false;
				break;
			default:
				DaisyIO.add_errs_(errs_, "warning", "Export", sprintf("invalid file type. :`%s`", filepath));
				return false;
		}

		return res;
	}

	static write_export_png_from_diagram_(filepath, diagram, errs_)
	{
		let err_ = {};

		/**
		png export is not synced.
		https://github.com/domenic/svg2png/issues/113
		*/
		let svgAsPngUri = require('save-svg-as-png').svgAsPngUri;
		let dataUriToBuffer = require('data-uri-to-buffer');

		const opt = {'scale':1};
		let draw = Renderer.generate_svgjsdraw_from_diagram(diagram, opt);
		if(null === draw){
			DaisyIO.add_errs_(errs_, err_.level, "Export", err_.message);
			return false;
		}

		let svg_elem = draw.node;
		// saveSvgAsPng(svg_elem, filepath, {scale: 3});
		svgAsPngUri(svg_elem,
			{
				'scale': 4,
				'backgroundColor': "#fff",
			},
			function(uri) {
			const decoded = dataUriToBuffer(uri)
			try{
				fs.writeFileSync(filepath, decoded);
			}catch(err){
				let err_ = {};
				DaisyIO.set_err_(err_, "warning", "Export", err.message);
				alart(err_);
				return;
			}
		});

		return true;
	}

	static write_export_svg_from_diagram_(filepath, diagram, errs_)
	{
		let err_ = {};
		const opt = {
			'scale': 1,
		};
		const strdata = DaisyIO.get_svg_string_from_diagram_(diagram, opt, err_);
		if(null === strdata){
			console.error(err_);
			DaisyIO.add_errs_(errs_, err_.level, "Export", err_.message);
			return false;
		}

		try{
			fs.writeFileSync(filepath, strdata);
		}catch(err){
			DaisyIO.add_errs_(errs_, "warning", "Export", sprintf("writeFile error. :`%s`", filepath));
			return false;
		}

		return true;
	}

	static get_svg_string_from_diagram_(diagram, opt, err_)
	{
		const xml_formatter = require('xml-formatter');
		const Version = require('./version');

		let s = Renderer.generate_svgstr_from_diagram(diagram, opt);

		const h = sprintf("<!-- Generator: %s %s  -->", Version.get_name(), Version.get_version());
		s = h + s;

		let options = {indentation: '\t',};
		return xml_formatter(s, options);
	}
};

