const { BrowserWindow, app, dialog } = require("electron")

async function create_window() {
	const window = new BrowserWindow({
		autoHideMenuBar: true,
		useContentSize: true,
		center: true,
		show: false,
		backgroundColor: "#334",

		width: 1280,
		minWidth: 640,
		height: 720,
		minHeight: 360,

		webPreferences: {
			allowRunningInsecureContent: true,
			autoplayPolicy: "no-user-gesture-required",
			contextIsolation: false,
			nodeIntegration: true,
		}
	})

	await window.loadFile("app/luna.html")
	window.show()
	return window
}

app.whenReady()
	.then(async () => { await create_window() })
	.catch((err) => { dialog.showErrorBox("Error creating window", `${err}`) })