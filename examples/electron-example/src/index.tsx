import React, { useState } from "react";
import { Nominal } from "simplytyped";
import style from "./style";

import { renderCalderaApp, Head } from "react-native-remote-web";

// Modules to control application life and create native browser window
//const {app, BrowserWindow} = require('electron')
//const path = require('path')
import { app, BrowserWindow } from 'electron'
import path from 'path'

type ItemID = Nominal<number, "ItemID">;
let key = 0;
const generateKey = () => {
  return key++ as ItemID;
};

interface TodoListItem {
  key: ItemID;
  value: string;
}

const TodoListItemComponent = ({
  value,
  onDone
}: {
  value: string;
  onDone: () => void;
}) => (
  <div className="TodoListItem">
    <div className="TodoListValue">{value}</div>
    <button className="onDoneButton" onClick={onDone}>
      ✖️
    </button>
  </div>
);

const TodoApp = () => {
  const [items, setItems] = useState<TodoListItem[]>([]);
  const [newItem, setNewItem] = useState<string>("");

  return (
    <>
      <Head>
        <title>{`Caldera | Todo (${items.length} ${items.length === 1 ? "Item" : "Items"
          })`}</title>
        <link
          href="https://fonts.googleapis.com/css?family=Work+Sans&display=swap"
          rel="stylesheet"
        />
        <style>{style}</style>
      </Head>
      <div className="main">
        {items.map(item => (
          <TodoListItemComponent
            key={item.key}
            value={item.value}
            onDone={() => setItems(items.filter(i => i.key !== item.key))}
          />
        ))}

        <form
          onSubmit={e => {
            e.preventDefault();
            if (newItem === "") return;
            setItems([
              ...items,
              {
                value: newItem,
                key: generateKey()
              }
            ]);
            setNewItem("");
          }}
        >
          <input
            className="newItemInput"
            onChange={e => {
              setNewItem(e.target.value);
            }}
            value={newItem}
          ></input>
          <button className="newItemButton" type="submit">
            ➕
          </button>
        </form>
      </div>
    </>
  );
};



async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })


  await renderCalderaApp(<TodoApp />);
  mainWindow.loadURL('http://127.0.0.1:8080')
  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')


  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



