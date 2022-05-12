var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);


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
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};




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
$("#task-form-modal .btn-primary").click(function() {
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

// task description was clicked (editing)
$(".list-group").on("click", "p", function() {
  // get existing description of <p> element
  var text = $(this).text().trim();
  // create new <textarea> input element
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  // swap current description with the edited element
  $(this).replaceWith(textInput);

  // autofocus for "edit mode" (UI)
  textInput.trigger("focus");
});
// task description was edited/changed & done editing/unfocused
$(".list-group").on("blur", "textarea", function() {
  // get <textarea>'s current (edited) value/text
  var text = $(this).val().trim();
  // get parent <ul>'s id attribute (status type)
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get task's position in list of other li elements (array)
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // use variable names as placeholders when updating the overarching task object (in the array/task list)
  tasks[status][index].text = text;
  // re-save to localstorage
  saveTasks();

  // convert <textarea> back into <p> element (recreating/replacing)
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

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
  // swap current due date with edited element
  $(this).replaceWith(dateInput);

  // automatically focus on new element ("edit mode" UI)
  dateInput.trigger("focus");
});
// due date was changed/editing field unfocused (done editing)
$(".list-group").on("blur", "input[type='text']", function() {
  // get current (edited) text
  var date = $(this).val().trim();

  // get parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element (w/ multiple bootstrap classes separated by spaces)
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
    // replace input with span element
    $(this).replaceWith(taskSpan);
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks
loadTasks();
