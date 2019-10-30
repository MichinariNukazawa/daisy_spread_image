'use strict';

module.exports = class Preference{
	static get_filepath(){
		const {app} = require('electron').remote;
		const fileex = require('./fileex');
		return fileex.join(app.getPath('userData'), "preference.json");
	}

	static init(){
		const fs = require("fs");
		const fileex = require('./fileex');

		const filepathDefaultPreference = fileex.join(__dirname, '../resource/default-preference.json');
		console.log(filepathDefaultPreference);
		const filepathPreference = Preference.get_filepath();
		let defaultPreference	= fileex.read_json(filepathDefaultPreference);
		let preference		= fileex.read_json(filepathPreference);
		//console.log(defaultPreference, preference);
		preference = Object.assign(defaultPreference, preference);

		fs.writeFileSync(filepathPreference, JSON.stringify(preference, null, '\t'));
	}

	static get_preference(){
		const fileex = require('./fileex');

		const filepathPreference = Preference.get_filepath();
		return fileex.read_json(filepathPreference);
	}

	static delete_preference(){
		const filepath = Preference.get_filepath();
		try{
			fs.unlinkSync(filepath);
		} catch (err) {
			console.error(filepath);
			return "delete error:\n" + err.message;
		}
		return "success.";
	}

	static get_filepath_user_css(){
		const {app} = require('electron').remote;
		const fileex = require('./fileex');
		return fileex.join(app.getPath('userData'), "user.css");
	}

	static save_preference_of_keypath(keypath, value){
		const fs = require("fs");

		let preference = Preference.get_preference();

		//今回は深い階層は無視する
		if(! preference.hasOwnProperty(keypath)){
			console.error(keypath);
		}
		preference[keypath] = value;
		console.log("save keypath:", keypath, value);

		const filepathPreference = Preference.get_filepath();
		fs.writeFileSync(filepathPreference, JSON.stringify(preference, null, '\t'));
	}
}

