import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

// --- SABİT VERİLER VE AYARLAR ---
const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00"];

const BASLANGIC_STOKLARI = {
    "mat": 4, "fiz": 3, "ing": 2, "edb": 3, "tarih": 2, "resim": 2,
};

const DERS_TANIMLARI = {
    "edb": { ad: "Edebiyat", renk: "#e74c3c", blok: true },
    "mat": { ad: "Matematik", renk: "#e74c3c", blok: true },
    "fiz": { ad: "Fizik", renk: "#e74c3c", blok: true },
    "ing": { ad: "İngilizce", renk: "#e74c3c", blok: true },
    "tarih": { ad: "Tarih", renk: "#e74c3c", blok: true },
    "resim": { ad: "Resim", renk: "#8e44ad", blok: false },
};

const DERS_KURALLARI = {
    "mat": { blok: true, gunlukMax: 2, izinliZamanlar: { 1: [1, 0], 2: [4, 5] } },
    "fiz": { blok: true, gunlukMax: 2, izinliZamanlar: { 1: [2], 3: [1, 0] } },
    "ing": { blok: true, gunlukMax: 2, izinliZamanlar: { 3: [5, 4] } },
    "edb": { blok: true, gunlukMax: 3, izinliZamanlar: { 1: [4, 5, 6] } },
    "tarih": { blok: true, gunlukMax: 2, izinliZamanlar: { 2: [1, 2] } },
    "resim": { blok: false, gunlukMax: 2, izinliZamanlar: { 2: [0], 3: [2, 6] } }
};

function DersProgrami() {
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const navigate = useNavigate();
    const [stoklar, setStoklar] = useState(BASLANGIC_STOKLARI);
    const [yerlesim, setYerlesim] = useState({});

    // STATE'LER
    const [seciliDersId, setSeciliDersId] = useState(null);
    const [secilenZaman, setSecilenZaman] = useState(null);

    const dosyaInputRef = useRef(null);

    // Kullanıcı Kontrolü
    useEffect(() => {
        const kayitliKullanici = localStorage.getItem('user');
        if (kayitliKullanici) {
            const userObj = JSON.parse(kayitliKullanici);
            setKullaniciAdi(userObj.fullName);
        } else {
            navigate('/');
        }
    }, [navigate]);

    // Veri Yükleme
    useEffect(() => {
        const kayitliVeri = localStorage.getItem("reactDersProgrami");
        if (kayitliVeri) {
            try {
                const parsed = JSON.parse(kayitliVeri);
                setYerlesim(parsed.yerlesim || {});
                setStoklar(parsed.stoklar || BASLANGIC_STOKLARI);
            } catch (e) { console.error("Veri hatası"); }
        }
    }, []);

    // --- KURAL KONTROL ---
    const kuralKontrol = (dersId, col, miktar) => {
        const kural = DERS_KURALLARI[dersId];
        if (kural.gunlukMax) {
            let bugunDersSayisi = 0;
            Object.keys(yerlesim).forEach(key => {
                const [c, r] = key.split('-').map(Number);
                if (c === col && yerlesim[key].dersId === dersId) {
                    bugunDersSayisi++;
                }
            });

            if (bugunDersSayisi + miktar > kural.gunlukMax) {
                return `Bu ders için günlük limit (${kural.gunlukMax} saat) aşıldı!`;
            }
        }
        return null;
    };

    // --- FONKSİYONLAR ---

    const handleDersTikla = (id) => {
        if (stoklar[id] <= 0) return;
        setSeciliDersId(id);
        setSecilenZaman(null);
    };

    const saatSeciminiOnayla = () => {
        if (!secilenZaman) return alert("Lütfen bir saat seçin!");

        const { col, row } = secilenZaman;
        const dersId = seciliDersId;
        const kural = DERS_KURALLARI[dersId];
        const blokMu = kural.blok && stoklar[dersId] >= 2;
        const miktar = blokMu ? 2 : 1;

        if (yerlesim[`${col}-${row}`]) return alert("Bu saat zaten dolu!");
        if (blokMu) {
            if (row >= SAATLER.length - 1) return alert("Blok ders tablo dışına taşıyor!");
            if (yerlesim[`${col}-${row + 1}`]) return alert("Blok ders için alt saat dolu!");
        }

        const hata = kuralKontrol(dersId, col, miktar);
        if (hata) return alert(hata);

        const yeniYerlesim = { ...yerlesim };
        const grupId = Date.now();
        yeniYerlesim[`${col}-${row}`] = { dersId, grupId };
        if (blokMu) yeniYerlesim[`${col}-${row + 1}`] = { dersId, grupId };

        setYerlesim(yeniYerlesim);
        setStoklar(prev => ({ ...prev, [dersId]: prev[dersId] - miktar }));
        setSeciliDersId(null);
    };

    const getSaatOpsiyonlari = (dersId) => {
        const opsiyonlar = [];
        const kural = DERS_KURALLARI[dersId];
        const blokMu = kural.blok && stoklar[dersId] >= 2;
        GUNLER.forEach((gun, colIndex) => {
            if (colIndex >= 5) return;

            SAATLER.forEach((saat, rowIndex) => {

                // 2. İzinli Zamanlar Kontrolü
                if (kural.izinliZamanlar) {
                    // Gün kontrolü
                    if (!kural.izinliZamanlar[colIndex]) return;

                    // Saat kontrolü (Başlangıç saati)
                    if (!kural.izinliZamanlar[colIndex].includes(rowIndex)) return;

                    // --- YENİ EKLENEN KISIM: Blok ders ise 2. saat de izinli mi? ---
                    if (blokMu) {
                        const ikinciSaatRow = rowIndex + 1;
                        // Eğer ikinci saat listede yoksa bu seçeneği gösterme!
                        if (!kural.izinliZamanlar[colIndex].includes(ikinciSaatRow)) return;
                    }
                }

                // 3. Blok dersin tablo dışına 
                if (blokMu) {
                    if (rowIndex >= SAATLER.length - 1) return; // Tablo sonuna sığmaz
                }

                opsiyonlar.push({
                    etiket: `${gun} ${saat}`,
                    col: colIndex,
                    row: rowIndex
                });
            });
        });
        return opsiyonlar;
    };

    const handleDersSil = (key, dersId, grupId) => {
        const yeniYerlesim = { ...yerlesim };
        let iadeMiktari = 0;
        Object.keys(yeniYerlesim).forEach(k => {
            if (yeniYerlesim[k].grupId === grupId) {
                delete yeniYerlesim[k];
                iadeMiktari++;
            }
        });
        setYerlesim(yeniYerlesim);
        setStoklar(prev => ({ ...prev, [dersId]: prev[dersId] + iadeMiktari }));
    };

    const kaydet = () => {
        localStorage.setItem("reactDersProgrami", JSON.stringify({ yerlesim, stoklar }));
        alert("Kaydedildi!");
    };
    const temizle = () => {
        if (confirm("Her şey silinecek?")) {
            setYerlesim({});
            setStoklar(BASLANGIC_STOKLARI);
            localStorage.removeItem("reactDersProgrami");
        }
    };
    const indir = () => {
        const siraliYerlesim = Object.keys(yerlesim).sort().reduce((obj, key) => {
            obj[key] = yerlesim[key];
            return obj;
        }, {});
        const blob = new Blob([JSON.stringify({ yerlesim: siraliYerlesim, stoklar }, null, 2)], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "ders_programi.json";
        a.click();
    };
    const yukle = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target.result);
                setYerlesim(json.yerlesim);
                setStoklar(json.stoklar);
            } catch (err) { alert("Dosya hatalı"); }
        };
        reader.readAsText(file);
    };


    return (
        <div className="ana-ekran">
            {/* SOL PANEL */}
            <div className="sol-panel">
                <h3>Dersler</h3>
                <small style={{ color: '#bbb', marginBottom: '20px', fontSize: '12px' }}>Ders eklemek için tıklayın</small>
                {Object.entries(DERS_TANIMLARI).map(([id, ders]) => (
                    <div
                        key={id}
                        className={`ders-kutusu ${stoklar[id] <= 0 ? 'stok-bitti' : ''}`}
                        style={{ backgroundColor: ders.renk, cursor: 'pointer' }}
                        onClick={() => handleDersTikla(id)}
                    >
                        <span>{ders.ad} {ders.blok && <span className="blok-ikon">B</span>}</span>
                        <span>({stoklar[id]})</span>
                    </div>
                ))}

                <div className="buton-grubu">
                    <button className="btn btn-kaydet" onClick={kaydet}>Kaydet</button>
                    <button className="btn btn-indir" onClick={indir}>İndir</button>
                    <button className="btn btn-yukle" onClick={() => dosyaInputRef.current.click()}>Yükle</button>
                    <button className="btn btn-temizle" onClick={temizle}>Sıfırla</button>
                </div>
                <input type="file" ref={dosyaInputRef} style={{ display: 'none' }} accept=".json" onChange={yukle} />
            </div>

            {/* SAĞ PANEL */}
            <div className="sag-sahne">


                <h2 style={{ color: '#2c3e50', marginTop: '50px' }}>Haftalık Ders Programı</h2>

                <table>
                    <thead>
                        <tr>
                            <th className="baslik-hucre">Saat/Gün</th>
                            {GUNLER.map(g => <th key={g} className="baslik-hucre">{g}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {SAATLER.map((saat, row) => (
                            <tr key={row}>
                                <td className="baslik-hucre" style={{ fontWeight: 'bold' }}>{saat}</td>
                                {GUNLER.map((_, col) => {

                                    const key = `${col}-${row}`;
                                    const dersVerisi = yerlesim[key];

                                    return (
                                        <td key={col}>
                                            {dersVerisi && (
                                                <div className="yerlesmis-ders" onDoubleClick={() => handleDersSil(key, dersVerisi.dersId, dersVerisi.grupId)}>
                                                    {DERS_TANIMLARI[dersVerisi.dersId]?.ad}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="bilgi-notu">
                    * Eklemek için soldaki derse tıklayın ve saati seçin.<br />
                    * Silmek için tablodaki derse çift tıklayın.<br />
                </div>
            </div>

            {/* SEÇİM EKRANI */}
            {seciliDersId && (
                <div className="modal-overlay">
                    <div className="modal-icerik">
                        <h3>{DERS_TANIMLARI[seciliDersId].ad} İçin Saat Seç</h3>
                        <div className="saat-opsiyon-listesi" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {getSaatOpsiyonlari(seciliDersId).length > 0 ? (
                                getSaatOpsiyonlari(seciliDersId).map((opt, index) => (
                                    <label key={index} className="saat-radyo">
                                        <input
                                            type="radio"
                                            name="zaman-secimi"
                                            onChange={() => setSecilenZaman({ col: opt.col, row: opt.row })}
                                        />
                                        {opt.etiket}
                                    </label>
                                ))
                            ) : (
                                <p style={{ color: 'red' }}>Bu ders için uygun saat kalmadı veya kural kısıtlaması var.</p>
                            )}
                        </div>
                        <button className="btn-sec" onClick={saatSeciminiOnayla}>Seç ve Programa Ekle</button>
                        <button className="btn-iptal" onClick={() => setSeciliDersId(null)}>İptal</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DersProgrami;