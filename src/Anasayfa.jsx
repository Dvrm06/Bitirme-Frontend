import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas'; // Kütüphaneyi import ettik
import './App.css';

// Sabitler (Aynı kalmalı)
const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00"];
const DERS_TANIMLARI = {
    "edb": { ad: "Edebiyat", renk: "#e74c3c", blok: true },
    "mat": { ad: "Matematik", renk: "#e74c3c", blok: true },
    "fiz": { ad: "Fizik", renk: "#e74c3c", blok: true },
    "ing": { ad: "İngilizce", renk: "#e74c3c", blok: true },
    "tarih": { ad: "Tarih", renk: "#e74c3c", blok: true },
    "resim": { ad: "Resim", renk: "#8e44ad", blok: false },
};


function Anasayfa() {
    const [yerlesim, setYerlesim] = useState({});
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const navigate = useNavigate();

    // HTML elemanını seçmek için referans
    const tabloRef = useRef(null);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) navigate('/');
        else setKullaniciAdi(JSON.parse(user).fullName);

        const kayitliVeri = localStorage.getItem("reactDersProgrami");
        if (kayitliVeri) {
            setYerlesim(JSON.parse(kayitliVeri).yerlesim || {});
        }
    }, [navigate]);

    // --- JPG İNDİRME FONKSİYONU ---
    const jpgIndir = async () => {
        const element = tabloRef.current;
        if (!element) return;

        // html2canvas ile fotoğraf çek
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#ecf0f1",
            useCORS: true
        });

        // Link oluştur ve otomatik tıkla
        const data = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = data;
        link.download = `${kullaniciAdi}_ders_programi.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="anasayfa-container">
            <div className="anasayfa-header">
                <h2>Merhaba, {kullaniciAdi} </h2>
                <p>İşte mevcut ders programın.</p>


                {/* FOTOĞRAFI ÇEKİLECEK ALAN */}
                <div ref={tabloRef} className="tablo-wrapper" style={{ padding: '20px', backgroundColor: '#ecf0f1' }}>
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
                                                    <div
                                                        className="yerlesmis-ders"
                                                        style={{ cursor: 'default', backgroundColor: DERS_TANIMLARI[dersVerisi.dersId]?.renk || '#3498db' }}
                                                    >
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
                </div>

                {/* İNDİRME BUTONU */}
                <button className="btn-jpg-indir" onClick={jpgIndir}>
                    📸 Programı JPG Olarak İndir
                </button>
            </div>
        </div>
    );
}

export default Anasayfa;