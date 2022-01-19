//@ts-nocheck PAGE SCALE = container.width / page.getWidth()

class App {
    private currentFileName: string;
    private currentFilePath: string;
    private pdfBuffer;
    private pdfDocument: any;
    private pdfRect;
    private isMozilla: boolean;



    constructor() {
        this.currentFileName = "";
        this.pdfRect = { x: null, y: null, w: null, h: null };
        this.isMozilla = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
        this.initialize();
    }



    private initialize = (): void => {
        document.getElementById("loginBtn").addEventListener("click", (e) => {
            e.preventDefault();
            const username: string = document.getElementById("usernameInput").value;
            const password: string = document.getElementById("passwordInput").value;

            if(username.length === 0 || password.length === 0) {
                alert("Proszę wypełnić wszystkie pola.");
            }
            else {
                const data: FormData = new FormData();
                data.append("username", username);
                data.append("password", password);
                
                fetch("../php/login.php", {
                    method: "POST",
                    body: data
                })
                .then(res => {
                    res.text().then(status => {
                        if(status === "1") {
                            document.getElementById("loginContainer").style.display = "none";
                            this.loadAppComponents();
                            this.initializeApp();
                        }
                        else if(status === "2")
                            alert("Brak połączenia z bazą danych.");
                        else if(status === "3")
                            alert("Błędny login lub hasło.");
                    });
                });
            }
        });
    };



    private loadAppComponents = (): void => {
        const app = document.getElementById("app");

        app.innerHTML += "<div id='mainNavContainer'>" +
                            "<h2>PDFModify</h2>" +
                            "<p>Plik</p>" +
                            "<p>Metadane</p>" +
                            "<p>O programie</p>" +
                            "<button id='loadFileBtn' class='appButton' style='margin-top: 10px;'>Wybierz plik</button>" +
                            "<button id='saveFileBtn' class='appButton' style='margin-top: 10px;'>Zapisz plik</button>" +
                            "<h2 id='saveInfo'>Zapisuję...</h2>" +
                         "</div>" +

                         "<div id='mainAppContainer'>" +
                            "<div id='noDataInfoContainer'>" +
                                "<input id='fileInput' type='file' style='display: none;'/>" +
                                "<h1 id='dataInfo'>Brak danych z pliku...</h1>" +
                            "</div>" +

                            "<div id='changeFileContainer' class='appElement'>" +
                                "<div id='userToolsContainer'>" +
                                    "<label for='colorInput'>Wybierz kolor:</label>" +
                                    "<input id='colorInput' name='colorInput' type='color' style='margin-left: 10px;'>" +
                                    "<button id='setDrawAreaBtn' class='appButton' style='margin-left: 10px;'>Zaznacz</button>" +
                                    "<button id='cancelBtn' class='appButton' style='margin-left: 10px;'>Anuluj</button>" +
                                "</div>" +

                                "<iframe id='pdfViewer'></iframe>" +

                                "<div id='drawArea'></div>" +
                            "</div>" +

                            "<div id='changeMetaDataContainer' class='appElement'>" +
                                "<h1>Metadane</h1>" +

                                "<label for='authorInput'>Autor:</label>" +
                                "<input id='authorInput' name='authorInput' type='text'/><br>" +

                                "<label for='titleInput'>Tytuł:</label>" +
                                "<input id='titleInput' name='titleInput' type='text'/><br>" +

                                "<label for='subjectInput'>Temat:</label>" +
                                "<input id='subjectInput' name='subjectInput' type='text'/><br>" +

                                "<label for='creatorInput'>Twórca:</label>" +
                                "<input id='creatorInput' name='creatorInput' type='text'/><br>" +

                                "<label for='keywordsInput'>Słowa Kluczowe:</label>" +
                                "<input id='keywordsInput' name='keywordsInput' type='text'/><br>" +

                                "<label for='producerInput'>Producent:</label>" +
                                "<input id='producerInput' name='producerInput' type='text'/><br>" +
                            "</div>" +

                            "<div id='aboutSoft' class='appElement'>" +
                                "<h1>PDFModify - Wersja 1.0.1</h1>" +
                                "<h1>Created by Kewin Woźny</h1>" +
                            "</div>" +
                        "</div>";

        app.style.display = "flex";
    };



    private initializeApp = (): void => {
        this.initializeMainNavBar();

        window.onbeforeunload = (e) => {
            e.preventDefault();
            e.returnValue = '';
            this.deleteFileFromServer();
        };

        document.getElementById("loadFileBtn").addEventListener("click", (): void => {
            document.getElementById("fileInput").click();
        });

        document.getElementById("fileInput").addEventListener("change", (e): void => {
            e.preventDefault();
            const appElements = document.querySelector("#mainAppContainer").querySelectorAll("div .appElement");
            const navElements = document.querySelector("#mainNavContainer").querySelectorAll("p");
            const dataInfoContainer = document.getElementById("noDataInfoContainer");
            const dataInfo = document.getElementById("dataInfo");
            const pdfViewer = document.getElementById("pdfViewer");
            const drawArea = document.getElementById("drawArea");
            const file = e.target.files[0];

            if(file.type.search("pdf") !== -1) {
                const formData: FormData = new FormData();
                formData.append("file", file);

                appElements.forEach((en): void => {
                    en.style.display = "none";
                });

                dataInfoContainer.style.display = "block";
                dataInfo.style.color = "black";
                dataInfo.innerText = "Proszę czekać...";

                this.deleteFileFromServer();
                pdfViewer.src = "";
                pdfViewer.style.pointerEvents = "all";

                drawArea.style.top = 0;
                drawArea.style.left = 0;
                drawArea.style.width = 0;
                drawArea.style.height = 0;

                for(const i in this.pdfRect)
                    this.pdfRect[i] = null;

                fetch("../php/upload.php", {
                    method: "POST",
                    body: formData
                })
                .then(res => {
                    res.text().then(status => { 
                        if(status === "1") {
                            this.currentFileName = file.name;
                            this.currentFilePath = "../uploads/" + file.name;

                            this.loadPdfDocument().then(() => {    
                                navElements[0].click();

                                if(this.isMozilla)
                                    alert("Proszę o rozszerzenie dokoumentu PDF do szerokości okna.");
                            });
                        }
                    });
                });
            }
            else
                alert("Proszę wybrać plik typu PDF.");
        });
    }


    private initializeMainNavBar = (): void => {
        const navElements = document.querySelector("#mainNavContainer").querySelectorAll("p");
        const appElements = document.querySelector("#mainAppContainer").querySelectorAll("div .appElement");
        const noDataInfo = document.getElementById("noDataInfoContainer");
        
        navElements.forEach((e, i): void => {
            e.addEventListener("click", (): void => {
                navElements.forEach((en): void => {
                    en.style.backgroundColor = "transparent";
                });

                appElements.forEach((en): void => {
                    en.style.display = "none";
                });

                e.style.backgroundColor = "rgb(80, 80, 80)";

                if(i === navElements.length - 1) {
                    noDataInfo.style.display = "none";
                    appElements[i].style.display = "block";
                }
                else {
                    if(this.currentFileName.length !== 0) {
                        noDataInfo.style.display = "none";
                        appElements[i].style.display = "block";
                    }
                    else
                        noDataInfo.style.display = "block";
                }
            });
        });

        document.getElementById("saveFileBtn").addEventListener("click", () => {
            this.savePdfDocument().then(() => { 
                const saveInfo = document.getElementById("saveInfo");
                saveInfo.style.display = "none";
            });
        });
    }



    private loadPdfDocument = async (): void => {
        const metadataInputs = document.querySelector("#changeMetaDataContainer").querySelectorAll("input");
        this.pdfBuffer = await fetch(this.currentFilePath).then(res => res.arrayBuffer());
        this.pdfDocument = await PDFLib.PDFDocument.load(this.pdfBuffer, { updateMetaData: true });
    
        metadataInputs[0].value = this.pdfDocument.getAuthor();
        metadataInputs[1].value = this.pdfDocument.getTitle();
        metadataInputs[2].value = this.pdfDocument.getSubject();
        metadataInputs[3].value = this.pdfDocument.getCreator();
        metadataInputs[4].value = this.pdfDocument.getKeywords();
        metadataInputs[5].value = this.pdfDocument.getProducer();

        enum CLICK_SETPOINT {
            FIRST_CLICK,
            SECOND_CLICK
        };

        const pdfViewer: HTMLIFrameElement = document.getElementById("pdfViewer");
        const changeFileContainer: HTMLDivElement = document.getElementById("changeFileContainer");
        const drawArea = document.getElementById("drawArea");
        let setAreaClicks: CLICK_SETPOINT = CLICK_SETPOINT.FIRST_CLICK;

        const drawAreaEvent = (e): void => {
            e.preventDefault();
            const areaRect = drawArea.getBoundingClientRect();

            drawArea.style.width = (e.clientX - areaRect.left) + "px";
            drawArea.style.height = (e.clientY - areaRect.top) + "px";
            this.pdfRect.w = parseInt(drawArea.style.width);
            this.pdfRect.h = parseInt(drawArea.style.height);
        };

        const setDrawAreaEvent = (e): void => {
            e.preventDefault();

            switch(setAreaClicks) {
                case CLICK_SETPOINT.FIRST_CLICK: 
                    drawArea.style.top = e.clientY + "px";
                    drawArea.style.left = e.clientX + "px";
                    this.pdfRect.x = e.offsetX;
                    this.pdfRect.y = e.offsetY;
                    changeFileContainer.addEventListener("mousemove", drawAreaEvent);
                    setAreaClicks = CLICK_SETPOINT.SECOND_CLICK;
                break;

                case CLICK_SETPOINT.SECOND_CLICK: 
                    setAreaClicks = CLICK_SETPOINT.FIRST_CLICK;
                    changeFileContainer.removeEventListener("mousedown", setDrawAreaEvent);
                    changeFileContainer.removeEventListener("mousemove", drawAreaEvent);
                break;
            }
        }

        pdfViewer.src = this.currentFilePath + "#view=FitH&toolbar=0";

        document.getElementById("setDrawAreaBtn").addEventListener("click", e => {
            e.preventDefault();
            pdfViewer.style.pointerEvents = "none";
            changeFileContainer.addEventListener("mousedown", setDrawAreaEvent);
        });

        document.getElementById("cancelBtn").addEventListener("click", e => {
            e.preventDefault();
            changeFileContainer.removeEventListener("mousedown", setDrawAreaEvent);
            drawArea.style.top = 0;
            drawArea.style.left = 0;
            drawArea.style.width = 0;
            drawArea.style.height = 0;
            pdfViewer.style.pointerEvents = "all";

            for(const i in this.pdfRect)
                this.pdfRect[i] = null;
        });
    }



    private savePdfDocument = async (): void => {
        if(this.pdfDocument !== undefined) {
            const saveInfo = document.getElementById("saveInfo");
            saveInfo.style.display = "block";

            this.pdfDocument = await PDFLib.PDFDocument.load(this.pdfBuffer, { updateMetaData: true });

            const metadataInputs = document.querySelector("#changeMetaDataContainer").querySelectorAll("input");
            const drawContainerRect = document.getElementById("changeFileContainer").getBoundingClientRect();
            const pages = this.pdfDocument.getPages();
            const colorValue: Array = document.getElementById("colorInput").value.split('');
            const r = parseInt(colorValue[1] + colorValue[2], 16) / 255;
            const g = parseInt(colorValue[3] + colorValue[4], 16) / 255;
            const b = parseInt(colorValue[5] + colorValue[6], 16) / 255;

            const convertPosToPDF = (axis: string, value: number): number => {
                let windowValue: number = 0;
                let pageValue: number = 0;
                const scale: number = (drawContainerRect.width / pages[0].getWidth());

                if(axis === "x") {
                    windowValue = drawContainerRect.width;
                    pageValue = pages[0].getWidth();
                }
                else if(axis === "y") {
                    windowValue = pages[0].getHeight() * scale;
                    pageValue = pages[0].getHeight();
                }

                return (value * pageValue) / windowValue;
            };

            this.pdfDocument.setAuthor(metadataInputs[0].value);
            this.pdfDocument.setTitle(metadataInputs[1].value);
            this.pdfDocument.setSubject(metadataInputs[2].value);
            this.pdfDocument.setCreator(metadataInputs[3].value);
            this.pdfDocument.setKeywords([metadataInputs[4].value]);
            this.pdfDocument.setProducer(metadataInputs[5].value);

            if(this.pdfRect.x != null) {
                const firstPage = pages[0];
                let startY = firstPage.getHeight() - convertPosToPDF("y", this.pdfRect.y) + convertPosToPDF("y", 70) - convertPosToPDF("y", this.pdfRect.h);

                if(this.isMozilla)
                    startY += convertPosToPDF("y", 20);

                for(const page of pages) {
                    page.drawRectangle({
                        x: convertPosToPDF("x", this.pdfRect.x),
                        y: startY,
                        width: convertPosToPDF("x", this.pdfRect.w) + 5,
                        height: convertPosToPDF("y", this.pdfRect.h),
                        color: PDFLib.rgb(r, g, b)
                    });
                }
            }

            const pdfBytes = await this.pdfDocument.save();
            const a = document.createElement("a");
            const file = new Blob([pdfBytes], { type: "application/pdf" });
            const newFileName = this.currentFileName.split(".")[0] + "-zmodyfikowany.pdf";

            a.href = URL.createObjectURL(file);
            a.download = newFileName;
            a.click();
        }
        else
            alert("Proszę wczytać plik PDF przed zapisaniem.");
    }



    private deleteFileFromServer = (): void => {
        if(this.currentFileName.length !== 0) {
            const data: FormData = new FormData();
            data.append("fileName", this.currentFileName);

            fetch("../php/delete.php", {
                method: "POST",
                body: data
            });
        }
    }
}