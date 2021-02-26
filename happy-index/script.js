//degişkenler
var ToplamMaskesizYuzSayisi = 0.0001;
var ToplamMaskeliYuzSayisi = 0.0001;
var DogruMaskeKullanimToplami = 0;
var KadinSayisi = 0.0001;
var ErkekSayisi = 0.0001;
var GenelMutlulukToplami = 0;
var KadinlarinMutlulukToplami = 0;
var ErkeklerinMutlulukToplami = 0;
var YasGrubu1ToplamMutluluk = 0;
var YasGrubu2ToplamMutluluk = 0;
var YasGrubu3ToplamMutluluk = 0;
var YasGrubu4ToplamMutluluk = 0;
var YasGrubu5ToplamMutluluk = 0;
var YasGrubu1ToplamSayi = 0.0001;
var YasGrubu2ToplamSayi = 0.0001;
var YasGrubu3ToplamSayi = 0.0001;
var YasGrubu4ToplamSayi = 0.0001;
var YasGrubu5ToplamSayi = 0.0001;

// sabitler arayüz elemanları
const video_el = document.getElementById('video');
const video_div_el = document.getElementById('video-div');
const face_canvas_el = document.getElementById('face-canvas');
const saat_el = document.getElementById('saat');
const loader_el = document.getElementById("loader");
const yuz_sayisi_el = document.getElementById('yüz-sayisi');
const kadin_sayisi_el = document.getElementById('kadin-sayisi');
const erkek_sayisi_el = document.getElementById('erkek-sayisi');
const analiz_yazisi_el = document.getElementById('analiz-yazi');
const oran_bari_el = document.getElementById('oran-bari');
const ortalama_mutluluk_orani_el = document.getElementById('ortalama-mutluluk-orani');
const kadinlarin_mutluluk_orani_el = document.getElementById('kadinlarin-mutluluk-orani');
const erkeklerin_mutluluk_orani_el = document.getElementById('erkeklerin-mutluluk-orani');
const maske_oran_el = document.getElementById('maske-oran-1');
const doru_maske_oran_el = document.getElementById('maske-oran-2');
const yas1_el = document.getElementById('yas-1');
const yas2_el = document.getElementById('yas-2');
const yas3_el = document.getElementById('yas-3');
const yas4_el = document.getElementById('yas-4');
const yas5_el = document.getElementById('yas-5');
const fps_el = document.getElementById('fps');


// ayarlar
const VIDEO_WIDTH = 844;            
const VIDEO_HEIGHT = 475;
const FPS = 10;
const HAREKETLI_ORT = 3;
const DRAW_BOX_OPTIONS = { lineWidth: 2, boxColor: "#FF8C00" };
const DEDECTOR_OPTIONS = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4, maxResults: 1 });
const FACE_CANVAS_SIZE = 128;

// faceapi ayarları
faceapi.env.monkeyPatch
({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
});

// yüz maskesi modelini yükle

var MaskeModel = null;
async function LoadMaskModel() {
    await tf.setBackend('webgl');
    MaskeModel = await tf.loadLayersModel('ai_mask_model/model.json');
}

function maskeTahminiYap(canvas_el) { 
    tf.engine().startScope();
    let inputTensor = tf.browser.fromPixels(canvas_el).toFloat();
    const offset = tf.scalar(127.5);
    inputTensor = inputTensor.sub(offset).div(offset);
    inputTensor = inputTensor.reshape([1, FACE_CANVAS_SIZE, FACE_CANVAS_SIZE, 3]);
    const prediction = MaskeModel.predict(inputTensor).dataSync();
    const data = Array.from(prediction)
    tf.engine().endScope();
    return data;
}

Promise.all
(
    [
        faceapi.nets.ssdMobilenetv1.loadFromUri('ai_tensorflow_models'),
        faceapi.nets.faceExpressionNet.loadFromUri('ai_tensorflow_models'),
        faceapi.nets.ageGenderNet.loadFromUri('ai_tensorflow_models'),
        LoadMaskModel()
    ]
).then(startVideo);

// web kamerasını aç
function startVideo()
{
    if(navigator.mediaDevices.getUserMedia)
    {
        navigator.mediaDevices.getUserMedia
        ({ 
            video:
            {
                width: { ideal: VIDEO_WIDTH },
                height: { ideal: VIDEO_HEIGHT },
                facingMode: "user"
            }
        })
        .then(function(stream)
        {
            video_el.srcObject = stream;
        })
        .catch(function(error)
        {
            console.log("Kamera açılırken hata oluştu !!!");
        });
    }
}


var VideoCanvas,DisplaySize,VideoCanvasContext,FaceCanvasContext;
video_el.addEventListener('playing',() =>
{
    face_canvas_el.width = FACE_CANVAS_SIZE;
    face_canvas_el.height = FACE_CANVAS_SIZE;

    VideoCanvas = faceapi.createCanvasFromMedia(video_el);
    VideoCanvas.width = video_el.offsetWidth;
    VideoCanvas.height = video_el.offsetHeight;

    video_div_el.appendChild(VideoCanvas);
    DisplaySize = { width: video_el.offsetWidth, height: video_el.offsetHeight };
    faceapi.matchDimensions(VideoCanvas, DisplaySize);

    VideoCanvasContext = VideoCanvas.getContext('2d');
    FaceCanvasContext = face_canvas_el.getContext('2d');

    start();

    setTimeout(() => { 
        loader_el.classList.remove("is-active");
    }, 10000)
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function start() { 
    const loop_start = (new Date()).getTime();

    try {
        await detect();
    }
    catch (err) { 
        console.log(err);
    }
    
    let loop_end = (new Date()).getTime();
    const diff_milliseconds = loop_end - loop_start
    const fps_milliseconds = 1000 / FPS;
    const diff = fps_milliseconds - diff_milliseconds;
    
    if (diff > 0) { 
        await sleep(diff);
    }

    loop_end = new Date().getTime();
    let fps_diff = loop_end - loop_start;
    if (fps_diff > 0) { 
        const real_fps = 1000 / fps_diff;
        fps_el.innerText = real_fps.toFixed(2);
    }

    
    start();
}

async function detect() {
    const detection = await faceapi.detectSingleFace(video_el, DEDECTOR_OPTIONS).withFaceExpressions().withAgeAndGender();

    // eğer hiç bir insan yüzü algılanmamışsa hiç bişey yapma 
    if (!detection) return;

    const resized_detection = faceapi.resizeResults(detection, DisplaySize);
    const resized_detection_box = resized_detection.detection.box;

    const tempCanvas = await yuzResminiAl(video_el, resized_detection_box);
    FaceCanvasContext.beginPath();
    FaceCanvasContext.drawImage(tempCanvas, 0, 0, FACE_CANVAS_SIZE, FACE_CANVAS_SIZE);

    const maskeTahmini = maskeTahminiYap(face_canvas_el);
    let dogruMaskeTakmaOrani = dogruMaskeTakmaOraniHesapla(maskeTahmini);
    
    //yüzü bulmak icin cizilen kareyi sil
    VideoCanvasContext.clearRect(0, 0, VideoCanvas.width, VideoCanvas.height);
    VideoCanvasContext.beginPath();
    const drawBox = new faceapi.draw.DrawBox(resized_detection_box, DRAW_BOX_OPTIONS);
    drawBox.draw(VideoCanvas);

    //maske takılı hesaplama yap
    if (dogruMaskeTakmaOrani != 0) {
        dogruMaskeTakmaOrani = maske_hort(dogruMaskeTakmaOrani);
        ToplamMaskeliYuzSayisi++;
        DogruMaskeKullanimToplami += dogruMaskeTakmaOrani;
        updateMaskGUI(dogruMaskeTakmaOrani);
        return;
    }

    ToplamMaskesizYuzSayisi++;

    //gender, tahmin edilen cinsiyeti alıyoruz
    const cinsiyet = cinsiyet_hort(detection.gender);

    //age, tahmin edilen yaşı alıyoruz
    const yas = yas_hort(detection.age);

    // happiness rate, mutluluk oranini hesaplıyoruz
    let mutlulukOrani = mutlulukOraniHesapla(detection.expressions);
    mutlulukOrani = mutluluk_hort(mutlulukOrani);
    GenelMutlulukToplami += mutlulukOrani;

    if(cinsiyet == "Kadın"){
        KadinSayisi++;
        KadinlarinMutlulukToplami += mutlulukOrani;
    }
    else{
        ErkekSayisi++;
        ErkeklerinMutlulukToplami += mutlulukOrani;
    }

    switch (true) {
        case (yas<=24):
            YasGrubu1ToplamMutluluk += mutlulukOrani;
            YasGrubu1ToplamSayi++;
        break;
        case (yas<=34):
            YasGrubu2ToplamMutluluk += mutlulukOrani;
            YasGrubu2ToplamSayi++;
        break;
        case (yas<=44):
            YasGrubu3ToplamMutluluk += mutlulukOrani;
            YasGrubu3ToplamSayi++;
            break;
        case (yas<=54):
            YasGrubu4ToplamMutluluk += mutlulukOrani;
            YasGrubu4ToplamSayi++;
        break;
        default:
            YasGrubu5ToplamMutluluk += mutlulukOrani;
            YasGrubu5ToplamSayi++;
        break;
    }

    updateHappyGUI(cinsiyet, yas, mutlulukOrani);

}

function dogruMaskeTakmaOraniHesapla(data) {
    let sonuc = 50;

    // doğru maske takılı olama ihtimali
    const maske_dogru = data[0]*100;
    // yanlış maske takılı olama ihtimali
    const maske_yanlis = data[1] * 100;
    // maske takılı olamama ihtimali
    const maske_yok = data[2]*100;


    if (maske_yok > maske_dogru && maske_yok > maske_yanlis) {
        // maske yok
        return 0;
    }
    else {
        if (maske_dogru > maske_yanlis) {
            sonuc += maske_dogru/2;
        }
        else
        {
            sonuc -= maske_yanlis/2;
        }

        // 0 hiç maske olmadığı anlamına geliyor
        if (sonuc < 1) sonuc = 1;
    }
    return sonuc;
}

function mutlulukOraniHesapla(data) {
    let sonuc = 50;
    const uzgun = data.sad * 100;
    const dogal = data.neutral * 100;
    const mutlu = data.happy * 100;

    if (dogal>uzgun && dogal>mutlu) {
        sonuc = 40;
        sonuc = sonuc + dogal/10;

        if(mutlu>uzgun){
            sonuc += mutlu/2;
        }
        else if(uzgun>mutlu){
            sonuc -= uzgun/2;
        }
    }
    else {
        if(mutlu>uzgun){
            sonuc += mutlu/2;
        }
        else if(uzgun>mutlu){
            sonuc -= uzgun/2;
        }
    }

    return sonuc;
}

function updateMaskGUI(dogruMaskeKullanimi) { 
    oran_bari_el.style.backgroundColor = '#4094b9';
    
    yuz_sayisi_el.innerText = Math.round(ToplamMaskesizYuzSayisi + ToplamMaskeliYuzSayisi);
    analiz_yazisi_el.innerHTML = `Doğru Maske Kullanım Oranı: %${dogruMaskeKullanimi}`;

    let maskeTakmaOrani = ToplamMaskeliYuzSayisi / (ToplamMaskesizYuzSayisi + ToplamMaskeliYuzSayisi);
    maskeTakmaOrani = Math.round(maskeTakmaOrani*100);
    let dogruMaskeTakmaOrani = DogruMaskeKullanimToplami / ToplamMaskeliYuzSayisi;
    dogruMaskeTakmaOrani = Math.round(dogruMaskeTakmaOrani);
    
    maske_oran_el.innerText = `${maskeTakmaOrani}`;
    doru_maske_oran_el.innerText = `${dogruMaskeTakmaOrani}`;
    oran_bari_el.innerText = `%${dogruMaskeKullanimi}`;
    oran_bari_el.style.height = `${dogruMaskeKullanimi}%`;
}

function updateHappyGUI(cinsiyet, yas, mutluluk) { 
    oran_bari_el.style.backgroundColor = '#00947e';

    yuz_sayisi_el.innerText = Math.round(ToplamMaskesizYuzSayisi + ToplamMaskeliYuzSayisi);
    kadin_sayisi_el.innerText = Math.round(KadinSayisi);
    erkek_sayisi_el.innerText = Math.round(ErkekSayisi);

    let maskeTakmaOrani = ToplamMaskeliYuzSayisi / (ToplamMaskesizYuzSayisi + ToplamMaskeliYuzSayisi);
    maskeTakmaOrani = Math.round(maskeTakmaOrani * 100);
    maske_oran_el.innerText = `${maskeTakmaOrani}`;

    analiz_yazisi_el.innerHTML = `${cinsiyet}, ${yas} Yaşında, %${mutluluk} Mutlu`;
    oran_bari_el.innerText = `%${mutluluk}`;
    oran_bari_el.style.height = `${mutluluk}%`;

    ortalama_mutluluk_orani_el.innerText = Math.round(GenelMutlulukToplami/ToplamMaskesizYuzSayisi);
    kadinlarin_mutluluk_orani_el.innerText = Math.round(KadinlarinMutlulukToplami/KadinSayisi);
    erkeklerin_mutluluk_orani_el.innerText = Math.round(ErkeklerinMutlulukToplami/ErkekSayisi);
    

    yas1_el.innerText = Math.round(YasGrubu1ToplamMutluluk/YasGrubu1ToplamSayi);
    yas2_el.innerText = Math.round(YasGrubu2ToplamMutluluk/YasGrubu2ToplamSayi);
    yas3_el.innerText = Math.round(YasGrubu3ToplamMutluluk/YasGrubu3ToplamSayi);
    yas4_el.innerText = Math.round(YasGrubu4ToplamMutluluk/YasGrubu4ToplamSayi);
    yas5_el.innerText = Math.round(YasGrubu5ToplamMutluluk/YasGrubu5ToplamSayi);
}

async function yuzResminiAl(video, box){ 

    let x = box.x, y = box.y, w=box.width, h=box.height;
    const vh = video.videoHeight;
    const vw = video.videoWidth;
    
    if (box.width > box.height) {
        if (box.width + y <= vh)
        {
            h = box.width;
        }
    }
    else {
        if (box.height + x <= vw) { 
            w = box.height;
        }
    }

    let regionsToExtract = [new faceapi.Rect(x, y, w, h)];

    if (x - 20 >= 0 && x + w + 20 <= vw && y + h + 40 <= vh) {
        regionsToExtract = [new faceapi.Rect(x - 20, y, w + 20, h + 40)];
    }
         
    const faceImages = await faceapi.extractFaces(video, regionsToExtract);
    return faceImages[0];
}  


var MUTLULUK_ARR = [];
function mutluluk_hort(deger) { 
    if(MUTLULUK_ARR.length>=HAREKETLI_ORT) MUTLULUK_ARR.shift();
    MUTLULUK_ARR.push(deger);
    const toplam = MUTLULUK_ARR.reduce((a, b) => a + b, 0);
    return Math.round(toplam / MUTLULUK_ARR.length);
}

var MASKE_ARR = [];
function maske_hort(deger) { 
    if(MASKE_ARR.length>=HAREKETLI_ORT) MASKE_ARR.shift();
    MASKE_ARR.push(deger);
    const toplam = MASKE_ARR.reduce((a, b) => a + b, 0);
    return Math.round(toplam / MASKE_ARR.length);
}

var YAS_ARR = [];
function yas_hort(deger) { 
    if(YAS_ARR.length>=HAREKETLI_ORT) YAS_ARR.shift();
    YAS_ARR.push(deger);
    const toplam = YAS_ARR.reduce((a, b) => a + b, 0);
    return Math.round(toplam / YAS_ARR.length);
}

var CINSIYET_ARR = [];
function cinsiyet_hort(cinsiyet) { 
    let deger = 0;
    if (cinsiyet == "male") deger = 1;
    if(CINSIYET_ARR.length>=HAREKETLI_ORT) CINSIYET_ARR.shift();
    CINSIYET_ARR.push(deger);
    const toplam = CINSIYET_ARR.reduce((a, b) => a + b, 0);
    return toplam / CINSIYET_ARR.length >= 0.5 ? "Erkek": "Kadın";
}


// arayüzün orta üstündeki, zamanı güncelle
const START_TIME = new Date().getTime();
setInterval(function () {

    const now = new Date().getTime();
    // başlagıç zamanından itibaren geçen toplam saniye cinsinden süre
    const distance = (now - START_TIME) / 1000;

    // saniye farkından saat, dakika ve saniyeyi bul
    let hours = Math.floor((distance % (60 * 60 * 24)) / (60 * 60));
    let minutes = Math.floor((distance % (60 * 60)) / 60);
    let seconds = Math.floor(distance % 60);

    // saat, dakika ve saniye tek rakamdan oluşuyorsa '03' gibi ayarla
    hours = `0${hours}`.slice(-2);
    minutes = `0${minutes}`.slice(-2);
    seconds = `0${seconds}`.slice(-2);

    // zamanı yazdır
    const time_string = `${hours}:${minutes}:${seconds}`;
    saat_el.innerText = time_string;
}, 1000); 

