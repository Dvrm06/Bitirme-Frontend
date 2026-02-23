import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import api from './api';
import './App.css';

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00"];

const SAAT_INDEXLERI = {
    "00:00:00": 0, "01:00:00": 1, "02:00:00": 2, "03:00:00": 3,
    "04:00:00": 4, "05:00:00": 5, "06:00:00": 6, "07:00:00": 7
};

function Anasayfa() {
    const [yerlesim, setYerlesim] = useState({});
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();
    const tabloRef = useRef(null);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/');
            return;
        } else {
            setKullaniciAdi(JSON.parse(user).fullName);
        }

        const programiGetir = async () => {
            try {
                // Hem dersleri hem grupları aynı anda backend'den istiyoruz
                const [lessonsResponse, groupsResponse] = await Promise.all([
                    api.get('/lessons'),
                    api.get('/lessonGroups')
                ]);

                const tumDersler = lessonsResponse.data?.data || [];
                const tumDersGruplari = groupsResponse.data?.data || [];

                // Ders ID'lerine göre isimleri bulabileceğimiz bir sözlük oluşturuyoruz
                const dersIsimleriMap = {};
                tumDersler.forEach(ders => {
                    dersIsimleriMap[ders.lessonID] = ders.lessonName;
                });

                let benimDerslerim = [];
                try { benimDerslerim = JSON.parse(localStorage.getItem('benimDerslerim') || '[]'); } catch (e) { }

                // Eğer eski düzende kaldıysa patlamasın diye
                if (benimDerslerim.length > 0 && typeof benimDerslerim[0] === 'number') {
                    benimDerslerim = [];
                }

                // Sadece benim seçtiğim grupları filtrele
                const benimIdlerim = benimDerslerim.map(d => d.lessonGroupID);
                const dersGruplari = tumDersGruplari.filter(grup => benimIdlerim.includes(grup.lessonGroupID));

                const yeniYerlesim = {};

                dersGruplari.forEach((grup) => {
                    if (grup.day !== null && grup.day !== undefined && grup.hour !== null) {
                        const colIndex = parseInt(grup.day);
                        const rowIndex = SAAT_INDEXLERI[grup.hour];

                        if (colIndex >= 0 && rowIndex >= 0) {
                            const anaDersAdi = dersIsimleriMap[grup.lessonID] || "Bilinmeyen Ders";
                            const kisaGrupAdi = grup.lessonGroupName.split(' (')[0];

                            yeniYerlesim[`${colIndex}-${rowIndex}`] = {
                                ad: anaDersAdi,         // Örn: MAT 222 - Diferansiyel...
                                grupAdi: kisaGrupAdi,   // Örn: Tek Grup
                                renk: anaDersAdi.includes('MAT') ? '#2980b9' :
                                    anaDersAdi.includes('BİM') ? '#8e44ad' : '#16a085'
                            };
                        }
                    }
                });

                setYerlesim(yeniYerlesim);
                setYukleniyor(false);

            } catch (error) {
                console.error("Program çekilirken hata oluştu:", error);
                setYukleniyor(false);
            }
        };

        programiGetir();
    }, [navigate]);

    const jpgIndir = async () => {
        const element = tabloRef.current;
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ecf0f1", useCORS: true });
        const data = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = data;
        link.download = `${kullaniciAdi}_ders_programi.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (yukleniyor) return <div className="anasayfa-container" style={{ justifyContent: 'center' }}><h2>Program Yükleniyor...</h2></div>;

    return (
        <div className="anasayfa-container">
            <div className="anasayfa-header">
                <h2>Merhaba, {kullaniciAdi} </h2>
                <p>İşte mevcut ders programın.</p>

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
                                                        style={{
                                                            cursor: 'default',
                                                            backgroundColor: dersVerisi.renk,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: '4px',
                                                            borderRadius: '5px'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '4px' }}>{dersVerisi.ad}</span>
                                                        <span style={{ fontSize: '11px', opacity: 0.9, fontStyle: 'italic' }}>{dersVerisi.grupAdi}</span>
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

                <button className="btn-jpg-indir" onClick={jpgIndir}>
                    📸 Programı JPG Olarak İndir
                </button>
            </div>
        </div>
    );
}

export default Anasayfa;