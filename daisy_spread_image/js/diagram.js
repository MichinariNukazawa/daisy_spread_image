'use strict';

const sprintf = require('sprintf-js').sprintf;

const ObjectUtil = require('./object-util');
const Version = require('./version');

module.exports = class Diagram{
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

	static create_from_native_format_string(strdata, errs_)
	{
		let native_doc = {};
		try{
			native_doc = JSON.parse(strdata);
		}catch(err){
			console.debug(err);
			DaisyIO.add_errs_(errs_, 'error', "Diagram", err.message);
			return null;
		}

		if(! native_doc.hasOwnProperty('diagram')){
			DaisyIO.add_errs_(errs_, 'error', "Diagram", 'nothing property "diagram"');
			return null;
		}

		const sanitized_diagram = Diagram.sanitize(native_doc.diagram, errs_);
		if(null === sanitized_diagram){
			return null;
		}

		return sanitized_diagram;
	}

	static sanitize(src_diagram, errs_)
	{
		//! @todo not implement
		return ObjectUtil.deepcopy(src_diagram);
	}

	static get_size(diagram)
	{
		return {
			'width':	diagram.property.document_width,
			'height':	diagram.property.document_height,
		};
	}

	static MAX_SIZE()
	{
		return 30000;
	}

	static MIN_SIZE()
	{
		return 150;
	}

	static set_size(diagram, size)
	{
		if(! Number.isFinite(size.width)
			|| Diagram.MIN_SIZE() > size.width
			|| Diagram.MAX_SIZE() < size.width){
			return false;
		}
		if(! Number.isFinite(size.height)
			|| Diagram.MIN_SIZE() > size.height
			|| Diagram.MAX_SIZE() < size.height){
			return false;
		}
		diagram.property.document_width = Math.round(size.width);
		diagram.property.document_height = Math.round(size.height);

		return true;
	}
};

