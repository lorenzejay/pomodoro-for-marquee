import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("clocked-in.start", () => {
      TimeTrackerPanel.createOrShow(context.extensionUri);
    })
  );
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out/compiled")],
  };
}
class TimeTrackerPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: TimeTrackerPanel | undefined;

  public static readonly viewType = "Time Tracker";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (TimeTrackerPanel.currentPanel) {
      TimeTrackerPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      TimeTrackerPanel.viewType,
      "Time Tracker",
      column || vscode.ViewColumn.One,
      { ...getWebviewOptions(extensionUri), retainContextWhenHidden: true }
    );

    TimeTrackerPanel.currentPanel = new TimeTrackerPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    TimeTrackerPanel.currentPanel = new TimeTrackerPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content

    this._panel.title = "Clocked In";
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    this._panel.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "alert":
          vscode.window.showInformationMessage(data.text);
      }
    });

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // // Update the content based on view changes
    // this._panel.onDidChangeViewState(
    //   (e) => {
    //     if (this._panel.visible) {
    //       this._update();
    //     }
    //   },
    //   null,
    //   this._disposables
    // );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" });
  }

  public dispose() {
    TimeTrackerPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  //   private _update() {
  //     const webview = this._panel.webview;

  //     // Vary the webview's content based on where it is located in the editor.
  //     switch (this._panel.viewColumn) {
  //       case vscode.ViewColumn.Two:
  //         this._updateForCat(webview, "Compiling Cat");
  //         return;

  //       case vscode.ViewColumn.Three:
  //         this._updateForCat(webview, "Testing Cat");
  //         return;

  //       case vscode.ViewColumn.One:
  //       default:
  //         this._updateForCat(webview, "Coding Cat");
  //         return;
  //     }
  //   }

  //   private _updateForCat(webview: vscode.Webview, ) {
  //     this._panel.title = catName;
  //     this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
  //   }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "Pomodoro.js")
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "Pomodoro.css")
    );

    // // Local path to css styles
    // const styleResetPath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "reset.css"
    // );
    // const stylesPathMainPath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "vscode.css"
    // );

    // Uri to load styles into webview
    // const stylesResetUri = webview.asWebviewUri(styleResetPath);
    // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesUri}" rel="stylesheet">
      <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      </script>
    </head>
    <body>
    </body>
    <script src="${scriptUri}" nonce="${nonce}">
    </html>`;
  }
}
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
// function getWebViewContent() {
//   return `<!DOCTYPE html>
//   <html lang="en">
//   <head>
// 	  <meta charset="UTF-8">

// 	  <meta http-equiv="Content-Security-Policy" content="default-src 'none';">

// 	  <meta name="viewport" content="width=device-width, initial-scale=1.0">

// 	  <title>d</title>
//   </head>
//   <body>
//   <input placeholder='What are you doing.'/>
//   <button>Start</button>
//   </body>
// 	</html>`;
// }
// this method is called when your extension is deactivated
// export function deactivate() {}
