const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
var format = require("date-fns/format");
var isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Error Message:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

let validateData = (request, response, next) => {
  const { priority, status, category, dueDate } = request.body;
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];

  if (priority !== undefined && priorityArray.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (status !== undefined && statusArray.includes(status) !== true) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== undefined &&
    categoryArray.includes(category) !== true
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== undefined && isMatch(dueDate, "yyyy-MM-dd") !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

let validateQuery = (request, response, next) => {
  const { priority, status, category, date } = request.query;
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];
  if (priority !== undefined && priorityArray.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (status !== undefined && statusArray.includes(status) !== true) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== undefined &&
    categoryArray.includes(category) !== true
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (date !== undefined && isMatch(date, "yyyy-MM-dd") !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

app.get("/todos/", validateQuery, async (request, response) => {
  const {
    priority = "",
    status = "",
    search_q = "",
    category = "",
  } = request.query;
  const filteredTodos = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo
    WHERE
        priority LIKE '%${priority}%' AND 
        status LIKE '%${status}%' AND 
        todo LIKE '%${search_q}%' AND
        category LIKE '%${category}%';
    `;
  const todos = await db.all(filteredTodos);
  response.send(todos);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectedTodo = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo
    WHERE
        id=${todoId};
    `;
  const todos = await db.get(selectedTodo);
  response.send(todos);
});

app.get("/agenda/", validateQuery, async (request, response) => {
  const { date } = request.query;
  const stringifiedDate = format(new Date(date), "yyyy-MM-dd");
  const selectedTodo = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo
    WHERE
        due_date='${stringifiedDate}';
    `;
  const todos = await db.all(selectedTodo);
  response.send(todos);
});

app.post("/todos/", validateData, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const stringifiedDate = format(new Date(dueDate), "yyyy-MM-dd");
  const updateTodo = `
    INSERT INTO
        todo(id,todo,priority,status,category,due_date)
    VALUES
        (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${stringifiedDate}'
        );
    `;
  await db.run(updateTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", validateData, async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  if (status !== undefined) {
    const updateStatus = `
        UPDATE
            todo
        SET
            status='${status}'
        WHERE
            id=${todoId};
        `;
    await db.run(updateStatus);
    response.send("Status Updated");
  }
  if (priority !== undefined) {
    const updatePriority = `
        UPDATE
            todo
        SET
            priority='${priority}'
        WHERE
            id=${todoId};
        `;
    await db.run(updatePriority);
    response.send("Priority Updated");
  }
  if (todo !== undefined) {
    const updateTodo = `
        UPDATE
            todo
        SET
            todo='${todo}'
        WHERE
            id=${todoId};
        `;
    await db.run(updateTodo);
    response.send("Todo Updated");
  }
  if (category !== undefined) {
    const updateCategory = `
        UPDATE
            todo
        SET
            category='${category}'
        WHERE
            id=${todoId};
        `;
    await db.run(updateCategory);
    response.send("Category Updated");
  }
  if (dueDate !== undefined) {
    const updateDueDate = `
        UPDATE
            todo
        SET
            due_date='${dueDate}'
        WHERE
            id=${todoId};
        `;
    await db.run(updateDueDate);
    response.send("Due Date Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
        DELETE FROM
            todo
        WHERE
            id=${todoId};
        `;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});
module.exports = app;
