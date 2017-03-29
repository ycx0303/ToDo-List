/**
 * Created by ycx on 2017/3/16.
 */
;(function () {
	'use strict';
	var $form_add_task = $('.add-task')
		, $window = $(window)
		, $body = $('body')
		, task_list = {}
		, $task_delete_trigger
		, $task_detail_trigger
		, $task_detail = $('.task-detail')
		, $task_detail_mask = $('.task-detail-mask')
		, current_index
		, $update_form
		, $task_detail_content
		, $task_detail_content_input
		, $checkbox_complete
		, $alerter = $('.alerter')
		;

	init();

	$form_add_task.on('submit', on_add_task_submit);
	$task_detail_mask.on('click', hide_task_detail);

	function pop(arg) {
		if (!arg) {
			console.error('pop title is required');
		}
		var conf = {}
			, $box
			, $mask
			, $title
			, $content
			, $confirm
			, $cancel
			, dfd
			, confirmed
			, timer

		dfd = $.Deferred();
		if (typeof arg == 'string') {
			conf.title = arg;
		}
		else {
			conf = $.extend(conf, arg);
		}

		$box = $('<div>' +
			'<div class="pop-title">' + conf.title + '</div>' +
			'<div class="pop-content">' +
			'<button class="confirm">确定</button>' +
			'<button class="cancel">取消</button>' +
			'</div>')
			.css({
				width: 300,
				height: 'auto',
				padding:'15px 10px',
				background: 'rgba(255,255,255,.7)',
				position: 'fixed',
				'border-radius': 3,
				'box-shadow': '0 1px 2px rgba(255,255,255,.5)'
			})

		$title = $box.find('.pop-title').css({
			padding: '5px 10px',
			'font-weight': 900,
			'font-size': 20,
			'text-align': 'center'
		})

		$content = $box.find('.pop-content').css({
			padding: '5px 10px',
			'text-align': 'center'
		})

		$confirm = $content.find('.confirm');
		$cancel = $content.find('.cancel');

		$mask = $('<div></div>')
			.css({
				position: 'fixed',
				background:'rgba(0,0,0,.5)',
				top: 0,
				bottom: 0,
				right: 0,
				left: 0
			})

		timer = setInterval(function () {
			if (confirmed !== undefined) {
				dfd.resolve(confirmed);
				clearInterval(timer);
				dismiss_pop();
			}
		}, 50)

		$confirm.on('click', on_confirm);
		$cancel.on('click', on_cancel);
		$mask.on('click', on_cancel);

		function on_confirm() {
			confirmed = true;
		}

		function on_cancel() {
			confirmed = false;
		}

		function dismiss_pop() {
			$mask.remove();
			$box.remove();
		}


		function adjust_box_position() {
			var window_height = $window.height(),
				window_width = $window.width(),
				box_height = $box.height(),
				box_width = $box.width(),
				move_x = (window_width - box_width) / 2,
				move_y = (window_height - box_height) / 2 - 20;
			$box.css({
				left: move_x,
				top: move_y
			})
		}


		$window.on('resize', function () {
			adjust_box_position();
		})

		$mask.appendTo($body);
		$box.appendTo($body);
		$window.resize();
		return dfd.promise();
	}

	function on_add_task_submit(e) {
		var new_task = {}, $input;
		/*禁用默认行为*/
		e.preventDefault();
		/*获取新task的值*/
		$input = $(this).find('input[name=content]');
		new_task.content = $input.val();
		/*如果新task的值为空 则直接返回 否则继续执行*/
		if (!new_task.content) return;
		/*存入新Task*/
		if (add_task(new_task)) {
			//render_task_list();
			$input.val(null);
		}
	}

	/*监听打开task详情事件*/
	function listen_task_detail() {
		var index;
		$('.task-item').on('dblclick', function () {
			index = $(this).data('index');
			show_task_detail(index)
		})
		/*监听详细按钮点击事件*/
		$task_detail_trigger.on('click', function () {
			var $this = $(this);
			var $item = $this.parent().parent();
			index = $item.data('index');
			/*显示任务详情*/
			show_task_detail(index);
		})
	}

	function listen_msg_hide() {
		$('.msg').on('click', function () {
			$(this).hide();
		})
	}

	/*监听完成task事件*/
	function listen_checkbox_complete() {
		$checkbox_complete.on('click', function () {
			var $this = $(this);
			//var is_complete = $this.is(':checked');
			var index = $this.parent().parent().data('index');
			var item = store.get('task_list')[index];
			// console.log(item);
			if (item && item.complete) {
				update_task(index, {complete: false});
			}
			else {
				update_task(index, {complete: true});
			}
		})
	}

	/*查找并监听所有删除按钮的点击事件*/
	function listen_task_delete() {
		$task_delete_trigger.on('click', function () {
			var $this = $(this);
			/*找到删除按钮所在的task元素*/
			var $item = $this.parent().parent();
			var index = $item.data('index');
			/*确认删除*/
			var result = pop("确定删除吗？")
				.then(function (result) {
					result ? delete_task(index) : null;
				})
		})
	}

	/*查看task详情界面*/
	function show_task_detail(index) {
		/*生产详情模板*/
		render_task_detail(index);
		current_index = index;
		/*显示详情模板（默认隐藏）*/
		$task_detail.show();
		/*显示详情模板（默认隐藏）*/
		$task_detail_mask.show();
	}

	/*隐藏任务详情界面*/
	function hide_task_detail() {
		$task_detail.hide();
		$task_detail_mask.hide();
	}

	/*更新详情描述*/
	function update_task(index, data) {
		if (!index || !task_list[index])
			return;
		task_list[index] = $.extend({}, task_list[index], data);
		// console.log(task_list[index]);
		refresh_task_list();
	}

	/*渲染task详情模板*/
	function render_task_detail(index) {
		if (index === undefined || !task_list[index])
			return;

		var item = task_list[index];
		var tpl =
			'<form>' +
			'<div class="content">' +
			item.content +
			'</div>' +
			'<div >' +
			'<input class="input-item" style="display: none;" type="text" name="content" value="' + item.content + '">' +
			'</div>' +
			'<div>' +
			'<div class="desc">' +
			'<textarea class="input-item" placeholder="添加详情" id="description" name="desc">' + (item.desc || '' ) + '</textarea>' +
			'</div>' +
			'</div>' +
			'<div class="remind">' +
			'<label class="input-item">提醒时间</label>' +
			'<input class="datetime input-item" type="date" name="remind_date" autocomplete="off" value="' + (item.remind_date || '') + '">' +
			'</div>' +
			'<div"><button type="submit" class="input-item">更新</button></div>' +
			'</div>' +
			'</form>';
		/*清空task详情模板*/
		$task_detail.html(null);
		/*用新模板替换旧模板*/
		$task_detail.html(tpl);
		/*加载日期插件*/
		$('.datetime').datetimepicker();
		/*选择其中的form元素，因为之后会用其监听submit事件*/
		$update_form = $task_detail.find('form');
		/*选中显示task内容（标题）元素*/
		$task_detail_content = $update_form.find('.content');
		/*选择task input的元素*/
		$task_detail_content_input = $update_form.find('[name=content]');
		/*双击task内容（标题）元素时变为可修改*/
		$task_detail_content.on('click', function () {
			$task_detail_content_input.show();
			$task_detail_content.hide();
		})

		/*监听$update_date的submit事件*/
		$update_form.on('submit', function (e) {
			e.preventDefault();
			var data = {};
			/*获取表单中各个input的值*/
			data.content = $(this).find('[name=content]').val();
			data.desc = $(this).find('[name=desc]').val();
			data.remind_date = $(this).find('[name=remind_date]').val();
			update_task(index, data);
			hide_task_detail();
		})
	}

	/*增加一条task*/
	function add_task(new_task) {
		/*将新Task推入task_list*/
		task_list.push(new_task);
		/*更新localStorage*/
		refresh_task_list();
		// render_task_list();
		return true;
	}

	/*删除一条task*/
	function delete_task(index) {
		/*如果没有index或者index不存在 则直接返回*/
		if (index === undefined || !task_list[index]) return;
		/*如果有，则在task_list中删除index相对应的task*/
		delete task_list[index];
		/*更新localStorage*/
		refresh_task_list();
	}

	/*每次task_list改变时更新到localStorage中,并渲染模板*/
	function refresh_task_list() {
		store.set('task_list', task_list);
		render_task_list();
	}

	function init() {
		task_list = store.get('task_list') || [];
		if (task_list.length)
			render_task_list();
		// listen_task_delete();
		task_remind_check();
	}

	function task_remind_check() {
		var cuttent_timeStamp;
		/*每隔500ms执行一次*/
		var itl = setInterval(function () {
			for (var i = 0; i < task_list.length; i++) {
				var item = store.get('task_list')[i];
				var task_timeStamp;
				if (!item || !item.remind_date || item.informed)
					continue;
				/*.getTime()返回值是指定的日期和时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数。
				 * 所以返回值越大表示时间越靠后*/
				cuttent_timeStamp = (new Date()).getTime();
				task_timeStamp = (new Date(item.remind_date)).getTime();
				/*当前时间比指定时间大1ms时提醒*/
				if (cuttent_timeStamp - task_timeStamp >= 1) {
					update_task(i, {informed: true});
					console.log(task_list[i]);
					show_msg(item.content);
				}
			}
		}, 500);

	}

	/*任务提醒*/
	function show_msg(msg) {
		if (!msg) return;
		$alerter.get(0).play();
		$('.msg').html('Remember: ' + msg).show();
	}


	/*渲染全部的task模板*/
	function render_task_list() {
		var $task_list = $('.task-list');
		$task_list.html('');
		var complete_items = [];
		for (var i = 0; i < task_list.length; i++) {
			var item = task_list[i];
			if (item && item.complete)
				complete_items[i] = item;
			else
				var $task = render_task_item(item, i);
			$task_list.prepend($task);
		}

		for (var j = 0; j < complete_items.length; j++) {
			$task = render_task_item(complete_items[j], j);
			if (!$task) continue;
			$task.addClass('completed');
			$task_list.append($task);
		}
		$task_delete_trigger = $('.action.delete');
		$task_detail_trigger = $('.action.detail');
		$checkbox_complete = $('.task-list .complete');

		listen_task_delete();
		listen_task_detail();
		listen_checkbox_complete();
		listen_msg_hide();

	}

	/*渲染单条task模板*/
	function render_task_item(data, index) {
		if (!data || !index) return;
		var list_item_tpl =
			'<div class="task-item" data-index="' + index + '">' +
			'<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
			'<span class="task-content">' + data.content + '</span>' +
			'<span class="float-right">' +
			'<span class="action detail"> 详细</span>' +
			'<span class="action delete"> 删除</span>' +
			'</span>' +
			'</div>';
		return $(list_item_tpl);
	}
})();