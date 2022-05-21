var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create task item's elements
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// reorder tasks by dragging and dropping (w/ sortable widget)
$(".card .list-group").sortable({
  // allow dragging across lists
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function() {
    // array to store the task data in
    var tempArr = [];
    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function() {
        // save task data to the temp array as an object
        tempArr.push({
            text: $(this).find("p").text().trim(),
            date: $(this).find("span").text().trim()
        });
      });

    // trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// trash icon's ability to be dropped onto
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    // remove dragged element from DOM
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    console.log(ui);
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// convert text input field into jQuery datepicker (pick due date from inline calender)
$("#modalDueDate").datepicker({
  minDate: 1
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// task description/text was clicked (editing)
$(".list-group").on("click", "p", function() {
  // get existing description of <p> element
  var text = $(this).text().trim();
  // create new <textarea> & swap current <p> element (description) with the new/edited input element
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);

  // autofocus new element for "edit mode" (UI)
  textInput.trigger("focus");
});

// task's description (editable field) was changed/un-focused
$(".list-group").on("blur", "textarea", function() {
  // get <textarea>'s current (edited) value/text
  var text = $(this).val().trim();
  // get id attr. of task's parent <ul> (status type/list)
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get task's position in the list containing all tasks (array)
  var index = $(this)
    .closest(".list-group-item").index();

  // update overarching task object in the array/task list (using var. names as placeholders)
  tasks[status][index].text = text;
  // re-save to localstorage
  saveTasks();

  // convert <textarea> back into <p> element (by recreating a <p> element)
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  // & then replacing the input field w/ new task text values
  $(this).replaceWith(taskP);
});

// due date was clicked (editing)
$(".list-group").on("click", "span", function() {
  // get existing due date/text
  var date = $(this).text().trim();
  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  // swap current due date with edited element's value
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1
    onClose: function() {
    // force "change" event on the due date input
    $(this).trigger("change");
    }
  });
  // automatically focus on the inline calender ("edit mode" UI)
  dateInput.trigger("focus");
});

// done editing due date's value (editable field was un-focused)
$(".list-group").on("change", "input[type='text']", function() {
  // get current/edited text's value
  var date = $(this).val().trim();
  // get task's parent <ul> id attribute & position in the list (array of tasks)
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = $(this).closest(".list-group-item").index();

  // update task in list/array & re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate format of <span> element (w/ value of new pick/changed date)
  var taskSpan = $("<span>")
    // multiple bootstrap classes are separated by spaces
    .addClass("badge badge-primary badge-pill")
    .text(date);
    // insert reformatted due date (<span>) element/pick in place of input field
    $(this).replaceWith(taskSpan);
    // audit/check task (parent <li>) element's new due date
    auditTask($(taskSpan).closest(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  console.log(tasks);
  saveTasks();
});

// load tasks
loadTasks();

// run audit/check of task (for due dates) every 30 min.
setInterval(function() {
  $(".card .list-group-item").each(function() {
    auditTask($(this));
  });
}, 1800000);
