// Hack to get highlighting
const css = (input: TemplateStringsArray) => {
  if (input.length !== 1) {
    throw new Error("This is not a real CSS tag");
  }
  return input[0];
};

const style = css`
  html,
  body {
    height: 100%;
    margin: 0;
    font-family: "Work Sans", sans-serif !important;
    font-size: 18px;
  }

  input,
  button {
    font-family: "Work Sans", sans-serif;
    font-size: 18px;
  }

  body {
    display: flex;
    background: rgb(54, 55, 56);
    justify-content: center;
    color: white;
  }

  .main {
    margin-top: 100px;
    width: fit-content;
    background: rgb(64, 65, 66);
    padding: 10px;
    box-shadow: 0 4px 10px 1px rgba(0, 0, 0, 0.7);
  }

  .TodoListValue {
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .TodoListItem {
    justify-content: space-between;
    display: flex;
    padding: 5px 0px 5px 5px;
  }

  .newItemInput {
    border: none;
    border-bottom: 2px solid black;
    background: transparent;
    color: white;
    width: 350px;
    outline: 0;
  }

  .newItemButton,
  .onDoneButton {
    background-color: transparent;
    background-repeat: no-repeat;
    border: none;
    cursor: pointer;
    overflow: hidden;
    outline: none;
    filter: contrast(0);
    padding: 5px 10px;
  }
`;

export default style;
