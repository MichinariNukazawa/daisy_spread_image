'use strict';

const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const join = require('path').join;
const openAboutWindow = require('about-window').default;

function message_dialog(strtype, strtitle, strmessage) {
	const {dialog} = require('electron').remote;
	dialog.showMessageBoxSync(
			remote.getCurrentWindow(),
			{
				type: strtype,
				buttons: ['OK'],
				title: ((typeof strtitle === 'string')? strtitle:'<none>'),
				message: strmessage,
			});
}

function confirm_dialog(strtitle, strmessage) {
	const {dialog} = require('electron').remote;
	let choice = dialog.showMessageBoxSync(
			remote.getCurrentWindow(),
			{
				type: 'question',
				buttons: ['Yes', 'No'],
				defaultId: 1,
				title: strtitle,
				message: strmessage,
			});

	return choice === 0;
};

function open_dialog(default_filepath)
{
	const {app} = require('electron').remote;
	const {dialog} = require('electron').remote;
	const fs = require('fs');
	const isExistSync = function(file)
	{
		try{
			fs.statSync(file);
		}catch(err){
			return false;
		}
		return true
	};

	let open_filepath = app.getPath('home');
	if('' != default_filepath){
		default_filepath = path.resolve(default_filepath);
		const dirpath = path.dirname(default_filepath);
		if(isExistSync(default_filepath)){
			open_filepath = default_filepath;
		}else if(isExistSync(dirpath) && fs.statSync(dirpath).isDirectory()){
			open_filepath = dirpath;
		}
	}
	console.debug('open_filepath', open_filepath);

	let filepath = dialog.showOpenDialogSync(
			remote.getCurrentWindow(),
			{
				title: 'Open',
				defaultPath: open_filepath,
				filters: [
				{name: 'Documents', extensions: ['daisysequence']},
				{name: 'All', extensions: ['*']},
				],
				properties: ['openFile'],
			});

	if(typeof filepath === "undefined"){
		return '';
	}

	filepath = filepath[0];
	return filepath;
}

function save_dialog(title, default_filepath)
{
	const {app} = require('electron').remote;
	const {dialog} = require('electron').remote;

	if('' == default_filepath){
		// 拡張子のみのファイルパスを作っておくとdialogが勝手にoverwrite確認をしてくれる
		default_filepath = path.join(app.getPath('home'), '.' + 'daisysequence');
	}
	let filepath = dialog.showSaveDialogSync(
			remote.getCurrentWindow(),
			{
				'title': title,
				defaultPath: default_filepath,
				filters: [
				{name: 'Documents', extensions: ['daisysequence']},
				{name: 'All', extensions: ['*']},
				],
			});
	if(typeof filepath === "undefined"){
		return '';
	}

	return filepath;
}

function export_dialog(default_filepath, format_name)
{
	const {app} = require('electron').remote;
	const {dialog} = require('electron').remote;

	if('' == default_filepath){
		default_filepath = path.join(app.getPath('home'), '.' + format_name);
	}else{
		default_filepath = default_filepath.replace(/\.[a-zA-Z0-9]*$/, '.' + format_name);
	}
	let filepath = dialog.showSaveDialogSync(
			remote.getCurrentWindow(),
			{
				title: 'Export',
				defaultPath: default_filepath,
				filters: [
				{name: format_name, extensions: [format_name]},
				{name: 'All', extensions: ['*']},
				],
			});
	if(typeof filepath === "undefined"){
		return '';
	}

	return filepath;
}

function menu_do_export_(format_name)
{
	let filepath = '';
	filepath = export_dialog(filepath, format_name);
	if('' == filepath){
		return;
	}

	let errs_ = [];
	let res = DaisyIO.write_export_diagram(filepath, get_doc().diagram, errs_);

	let message_ = "";
	for(let i = 0; i < errs_.length; i++){
		message_ += sprintf("%s: %s\n", errs_[i].level, errs_[i].message);
	}

	if(! res){
		message_dialog('warning', "Export", "Export error.\n" + message_);
		return;
	}else{
		if(0 !== errs_.length){
			message_dialog('info', "Export", "Export info.\n" + message_);
		}
	}

	console.log("Export");
}

const debug_menu = {
	label: 'debug(develop)',
	submenu: [
/*
	{
		label: 'Reload',
		accelerator: 'CmdOrCtrl+R',
		click: function (item, focusedWindow) {
			if (focusedWindow) focusedWindow.reload()
		}
	},
	{
		label: 'Toggle Full Screen',
		accelerator: (function () {
			if (process.platform === 'darwin') {
				return 'Ctrl+Command+F'
			} else {
				return 'F11'
			}
		})(),
		click: function (item, focusedWindow) {
			if (focusedWindow) {
				focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
			}
		}
	},
*/
	{
		label: 'Toggle Developer Tools',
		accelerator: (function () {
			if (process.platform === 'darwin') {
				return 'Alt+Command+I'
			} else {
				return 'Ctrl+Shift+I'
			}
		})(),
		click: function (item, focusedWindow) {
			if (focusedWindow) focusedWindow.toggleDevTools()
		}
	}
	]
};

var template = [
{
	label: '&File',
	submenu: [
	{
		label: '&Export SVG',
		accelerator: 'CmdOrCtrl+Shift+E',
		click: function () {
			menu_do_export_('svg');
		}
	},
	{
		label: 'Export PNG',
		click: function () {
			menu_do_export_('png');
		}
	},
	{type: 'separator'},
	{
		label: '&Quit',
		accelerator: 'CmdOrCtrl+Q',
		click: function () {
			const {app} = require('electron').remote;
			app.quit();
		},
	},
	]
},
{
	label: '&Edit',
	submenu: [
	// キーボード・ショートカット表示用のダミー(js/index.js onloadにて処理)
	{
		label: '&Cut',
		accelerator: 'CmdOrCtrl+X',
		selector: "cut:"
	},
	{
		label: '&Copy',
		accelerator: 'CmdOrCtrl+C',
		selector: "copy:"
	},
	{
		label: '&Paste',
		accelerator: 'CmdOrCtrl+V',
		selector: "paste:"
	},
	]
},
{
	label: '&Help',
	role: 'help',
	submenu: [
	{
		label: 'daisy bell official site',
		click: function () { require('electron').shell.openExternal('https://daisy-bell.booth.pm/') }
	},
	{
		label: 'Donate',
		submenu: [
		{
			label: 'Donate(Amazon)',
			click: function () { require('electron').shell.openExternal('http://amzn.asia/gxaSPhE') }
		},
		]
	},
	{
		label: 'Bug and Request',
		submenu: [
		{
			label: 'mailto:michinari.nukazawa@gmail.com',
			click: function () { require('electron').shell.openExternal('mailto:michinari.nukazawa@gmail.com') }
		},
		{
			label: 'twitter:@MNukazawa',
			click: function () { require('electron').shell.openExternal('https://twitter.com/MNukazawa') }
		},
		]
	},
	{
		label: 'GitHub',
		click: function () { require('electron').shell.openExternal('https://github.com/MichinariNukazawa/daisy_spread_image') }
	},
	{type: 'separator'},
	debug_menu,
	{type: 'separator'},
	{
		label: '&About',
		click: function () {
			openAboutWindow({
				icon_path: join(__dirname, 'image/icon.png'),
				copyright: 'Copyright (c) 2018 project daisy bell',
				package_json_dir: __dirname,
				// open_devtools: process.env.NODE_ENV !== 'production',
			});
		}
	}
	]
}
]

function insert_window_menu(){
	template.splice(2, 0,
			{
				label: 'Window',
				role: 'window',
				submenu: [
				{
					label: 'Minimize',
					accelerator: 'CmdOrCtrl+M',
					role: 'minimize'
				},
				{
					label: 'Close',
					accelerator: 'CmdOrCtrl+W',
					role: 'close'
				}
				]
			});
}

if (process.platform === 'darwin') {
	insert_window_menu();

	var name = require('electron').remote.app.getName()
		template.unshift({
			label: name,
			submenu: [
			{
				label: 'About ' + name,
				role: 'about'
			},
			{
				type: 'separator'
			},
			{
				label: 'Services',
				role: 'services',
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				label: 'Hide ' + name,
				accelerator: 'Command+H',
				role: 'hide'
			},
			{
				label: 'Hide Others',
				accelerator: 'Command+Alt+H',
				role: 'hideothers'
			},
			{
				label: 'Show All',
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				label: 'Quit',
				accelerator: 'Command+Q',
				click: function () {
					const {app} = require('electron').remote;
					app.quit()
				}
			}
			]
		})
	// Window menu.
	template[3].submenu.push(
			{
				type: 'separator'
			},
			{
				label: 'Bring All to Front',
				role: 'front'
			}
			)
}

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

