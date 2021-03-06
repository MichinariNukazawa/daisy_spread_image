'use strict';

module.exports.RenderingHandle = class RenderingHandle{
	constructor(elemId)
	{
		this.draw = null;
		this.groups = [];

		this.draw = SVG(elemId).size(0, 0);
		this.clear();

		this.resource = RenderingHandle.generate_resource();
	}

	static generate_resource()
	{
		let resource = {};
/*
		try{
			const fs = require("fs");
			const path = require('path');
			const filepath = path.join(__dirname, '../image/edge.svg');
			resource.edge_icon_svg = fs.readFileSync(filepath, 'utf8');
		}catch(err){
			console.error(err);
		}
*/
		return resource;
	}

	get_draw()
	{
		return this.draw;
	}

	get_other_group()
	{
		return this.groups.other_group;
	}

	get_root_group()
	{
		return this.groups.root_group;
	}

	get_background_group()
	{
		return this.groups.background_group;
	}

	get_diagram_group()
	{
		return this.groups.diagram_group;
	}

	get_editor_group()
	{
		return this.groups.editor_group;
	}

	get_focus_group()
	{
		return this.groups.focus_group;
	}

	clear()
	{
		this.groups = [];
		this.draw.clear();

		this.groups.root_group			= this.draw.group().addClass('dd__root-group');
		this.groups.background_group		= this.get_root_group().group().addClass('dd__background-group');
		this.groups.diagram_group		= this.get_root_group().group().addClass('dd__diagram-group');
		this.groups.other_group			= this.get_root_group().group().addClass('dd__other-group');

		this.groups.editor_group		= this.get_root_group().group().addClass('dd__editor-group');
		this.groups.focus_group			= this.get_editor_group().group().addClass('dd__focus-group');
	}
};

module.exports.Renderer = class Renderer{
	static rerendering(rendering_handle, src_diagram, focus, mouse_state, tool_kind)
	{
		rendering_handle.clear();

		const deepcopy = function(obj){
			return JSON.parse(JSON.stringify(obj))
		};
		let diagram = deepcopy(src_diagram);
		diagram.width = diagram.property.document_width;
		diagram.height = diagram.property.document_height;

		if(null === diagram){
			return null;
		}

		const diagram_size = {
			'x': diagram.property.document_width ,
			'y': diagram.property.document_height,
		};

		const opt = {};
		const svgstr_diagram = Renderer.generate_svgstr_from_diagram(diagram, opt);
		rendering_handle.thumbnail_info = {
			'svgstr_diagram': svgstr_diagram,
			'diagram_size': diagram_size,
		};


		const canvas_scale = diagram.property.canvas_scale_par / 100;
		const canvas_info = {
			'canvas_size': {
				'x': diagram.property.document_width  * canvas_scale,
				'y': diagram.property.document_height * canvas_scale,
			},
			'diagram_size': diagram_size,
			'scale': canvas_scale,
			'margin': 2,
		};
		console.debug(canvas_info, diagram.property.canvas_scale_par);

		Renderer.rendering_canvas_(rendering_handle, svgstr_diagram, canvas_info, focus, mouse_state, tool_kind);
	}

	static rendering_thumbnail(rendering_handle, rendering_handle_src, thumbnail_size)
	{
		rendering_handle.clear();

		const scale_x = thumbnail_size.x / rendering_handle_src.thumbnail_info.diagram_size.x;
		const scale_y = thumbnail_size.y / rendering_handle_src.thumbnail_info.diagram_size.y;
		const scale = Math.min(scale_x, scale_y);
		const canvas_info = {
			'canvas_size': {
				'x': thumbnail_size.x,
				'y': thumbnail_size.y,
			},
			'diagram_size': rendering_handle_src.thumbnail_info.diagram_size,
			'scale': scale,
			'margin': 2,
		};
		console.debug('thumb info', canvas_info);
		const svgstr_diagram = rendering_handle_src.thumbnail_info.svgstr_diagram;
		Renderer.rendering_canvas_(rendering_handle, svgstr_diagram, canvas_info, null, null, null);
	}

	static rendering_canvas_(rendering_handle, svgstr_diagram, canvas_info, focus, mouse_state, tool_kind){
		rendering_handle.get_draw().size(
			canvas_info.canvas_size.x + (canvas_info.margin * 2),
			canvas_info.canvas_size.y + (canvas_info.margin * 2),
		);

		// diagramの描画サイズ
		const diagram_rendering_size = {
			'x': canvas_info.diagram_size.x * canvas_info.scale,
			'y': canvas_info.diagram_size.y * canvas_info.scale,
		};

		// canvas内でdiagramをセンタリング表示する際の位置(左上座標)
		const diagram_position = {
			'x': canvas_info.margin + ((canvas_info.canvas_size.x - diagram_rendering_size.x) / 2),
			'y': canvas_info.margin + ((canvas_info.canvas_size.y - diagram_rendering_size.y) / 2),
		};

		rendering_handle.get_diagram_group().svg(svgstr_diagram);
		rendering_handle.get_diagram_group().move(diagram_position.x, diagram_position.y);
		rendering_handle.get_diagram_group().scale(canvas_info.scale, canvas_info.scale, 0, 0);
/*
		Renderer.draw_focus_(rendering_handle, focus);

		Renderer.draw_mouse_state_(rendering_handle, mouse_state);

		Renderer.draw_tool_(rendering_handle, diagram, mouse_state, tool_kind);
*/
		// ** frame
		{
			let background_group = rendering_handle.get_background_group();
			if(null === background_group){
				console.error('bug');
				return;
			}

			let rect = {
				'x': diagram_position.x,
				'y': diagram_position.y,
				'width':	diagram_rendering_size.x,
				'height':	diagram_rendering_size.y,
			};
			background_group.rect(rect.width, rect.height)
				.move(rect.x, rect.y)
				.attr({
				'stroke':		'#ddd',
				'fill-opacity':		'0',
				'stroke-width':		'2',
			});
		}
	}

	static groupdrawing_circle_svg_(circle_group, diagram, elem){
		console.debug(diagram.property.magickcircle_dirpath, elem.subfilepath);

		const filepath = path.join(diagram.property.magickcircle_dirpath, elem.subfilepath);
		let circleimage_svg = fs.readFileSync(filepath, 'utf8');
		let diagram_group_ = circle_group.group().addClass('dd__circle_group__AA');
				diagram_group_.move(elem.x, elem.y)
				diagram_group_.scale(elem.scale, elem.scale)
				diagram_group_.skew(elem.skew.x, elem.skew.y)
				;
		diagram_group_.svg(circleimage_svg)
				.rotate(elem.rotate_degree, 1000 / 2, 1000 / 2)
				.attr({
					'opacity':	1.0,
				});
	}

	static generate_svgjsdraw_from_diagram(diagram, opt){
		console.debug("diag", diagram.property.document_width, diagram.property.document_height);

		let dummy_elem = document.createElementNS('http://www.w3.org/2000/svg','svg');
		let draw = SVG(dummy_elem).size(0, 0);

		let root_group = draw.group().addClass('dd__root_group');

		if(opt.hasOwnProperty('scale')){
			draw.size(diagram.property.document_width * opt.scale, diagram.property.document_height * opt.scale);
			root_group.scale(opt.scale, opt.scale);
		}else{
			draw.size(diagram.property.document_width, diagram.property.document_height);
		}

		if(opt.hasOwnProperty('background_color')){
			let backgroud_group = root_group.group().addClass('dd__background');
			backgroud_group.rect('100%','100%')
					.attr({
						'fill':		opt.background_color,
					});
		}

		let circle_group = root_group.group().addClass('dd__circle_group');

		for(let i = 0; i < diagram.diagram_elements.length; i++){
			const diagram_element = diagram.diagram_elements[i];
			console.debug(i, diagram_element);

			switch(diagram_element.kind){
				case 'circle_svg':
					Renderer.groupdrawing_circle_svg_(circle_group, diagram, diagram_element);
					break;
				default:
					console.error("bug", i, diagram_element);
					alert(diagram_element);
			}
		}

		return draw;
	}

	static generate_svgstr_from_diagram(diagram, opt){
		const draw = Renderer.generate_svgjsdraw_from_diagram(diagram, opt);
		return draw.svg();
	}
};

