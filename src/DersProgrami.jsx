import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAAT_DILIMLERI = {
    "00:00:00": "09.00-10.00", "01:00:00": "10.00-11.00", "02:00:00": "11.00-12.00",
    "03:00:00": "12.00-13.00", "04:00:00": "13.00-14.00", "05:00:00": "14.00-15.00",
    "06:00:00": "15.00-16.00", "07:00:00": "16.00-17.00"
};

function DersProgrami() {
    const navigate = useNavigate();
    const [dersler, setDersler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState('');

    const [modalAcik, setModalAcik] = useState(false);
    const [seciliDers, setSeciliDers] = useState(null);
    const [seciliDersGruplari, setSeciliDersGruplari] = useState([]);
    const [gruplarYukleniyor, setGruplarYukleniyor] = useState(false);

    useEffect(() => {
        const dersleriGetir = async () => {
            try {
                const response = await api.get('/lessons');
                if (response.data && response.data.status) {
                    setDersler(response.data.data);
                }
                setYukleniyor(false);
            } catch (error) {
                console.error("Dersler çekilirken hata:", error);
                setHata("Ders listesi yüklenemedi. Lütfen bağlantınızı kontrol edin.");
                setYukleniyor(false);
            }
        };
        dersleriGetir();
    }, []);

    const handleDersTikla = async (ders) => {
        setSeciliDers(ders);
        setModalAcik(true);
        setGruplarYukleniyor(true);
        setSeciliDersGruplari([]);

        try {
            const response = await api.get(`/lessonGroups?lessonID=${ders.lessonID}`);
            if (response.data && response.data.status) {
                setSeciliDersGruplari(response.data.data);
            }
            setGruplarYukleniyor(false);
        } catch (error) {
            console.error("Gruplar çekilirken hata:", error);
            setGruplarYukleniyor(false);
        }
    };

    const derseKayitOl = async (grup) => {
        try {
            // Hileli hafızamızı çekiyoruz
            let benimDerslerim = JSON.parse(localStorage.getItem('benimDerslerim') || '[]');

            // Eğer eski formatta (sadece sayı ID) kaldıysa temizleyip yeni formata geçelim
            if (benimDerslerim.length > 0 && typeof benimDerslerim[0] === 'number') {
                benimDerslerim = [];
                localStorage.removeItem('benimDerslerim');
            }

            // Gruptan "Tek Grup", "Grup 1" gibi temel adı koparıyoruz
            const temelGrupAdi = grup.lessonGroupName.split(' (')[0];

            // AYNI DERSİN BAŞKA BİR GRUBU SEÇİLMİŞ Mİ KONTROLÜ
            const baskaGrupVarMi = benimDerslerim.find(
                d => d.lessonID === seciliDers.lessonID && d.temelGrupAdi !== temelGrupAdi
            );

            if (baskaGrupVarMi) {
                alert(`HATA: Bu dersin zaten "${baskaGrupVarMi.temelGrupAdi}" isimli şubesine kayıtlısınız! Başka grup seçemezsiniz.`);
                return;
            }

            const response = await api.post('/lessonGroups/register', {
                lessonGroupID: grup.lessonGroupID
            });

            if (response.data && response.data.status) {
                // Sadece ID değil, dersin kime ait olduğunu da kaydediyoruz
                benimDerslerim.push({
                    lessonGroupID: grup.lessonGroupID,
                    lessonID: seciliDers.lessonID,
                    temelGrupAdi: temelGrupAdi
                });
                localStorage.setItem('benimDerslerim', JSON.stringify(benimDerslerim));

                alert("Saati başarıyla seçtiniz! Kalan saatleri de seçebilirsiniz.");

                // Seçilen saati ekrandan anında yok etmek için modal listesinden çıkarıyoruz
                setSeciliDersGruplari(prev => prev.filter(g => g.lessonGroupID !== grup.lessonGroupID));
            }
        } catch (error) {
            const mesaj = error.response?.data?.message || "Kayıt olurken bir hata oluştu veya zaten kayıtlısınız.";
            alert(mesaj);
        }
    };

    // Modaldaki Grupları Filtreleme İşlemi (Daha önce seçilmiş olanlar ekranda çıkmaz)
    let kayitliDersler = [];
    try { kayitliDersler = JSON.parse(localStorage.getItem('benimDerslerim') || '[]'); } catch (e) { }
    const kayitliIdler = kayitliDersler.map(d => d.lessonGroupID);

    // Sadece henüz kayıt olunmamış grupları ekranda bırakıyoruz
    const gosterilecekGruplar = seciliDersGruplari.filter(grup => !kayitliIdler.includes(grup.lessonGroupID));

    if (yukleniyor) return <div className="ana-ekran merkez-ekran"><h2>Dersler Yükleniyor...</h2></div>;
    if (hata) return <div className="ana-ekran merkez-ekran hata-mesaji"><h2>{hata}</h2></div>;

    return (
        <div className="ana-ekran ders-secimi-ekrani">
            <h2 className="ders-secimi-baslik">Açılan Dersler</h2>
            <p className="ders-secimi-aciklama">Alt gruplarını ve gün/saat detaylarını görmek istediğiniz dersin üzerine tıklayın.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '1000px' }}>
                {dersler.length > 0 ? (
                    dersler.map((ders) => (
                        <div
                            key={ders.lessonID}
                            onClick={() => handleDersTikla(ders)}
                            style={{
                                backgroundColor: 'white', padding: '25px', borderRadius: '12px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer',
                                width: '250px', textAlign: 'center', borderTop: '6px solid #3498db',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{ders.lessonName}</h3>
                            <p style={{ margin: '0', fontSize: '13px', color: '#7f8c8d' }}>Bölüm: {ders.departmentName || '-'}</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold' }}>{ders.semesterNo}. Dönem</p>
                        </div>
                    ))
                ) : (<p style={{ color: '#888' }}>Sistemde kayıtlı ana ders bulunmuyor.</p>)}
            </div>

            {modalAcik && (
                <div className="modal-overlay" onClick={() => setModalAcik(false)}>
                    <div className="modal-icerik" style={{ width: '700px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: '0', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                            {seciliDers?.lessonName} - Grup Seçimi
                        </h3>

                        {gruplarYukleniyor ? (<p style={{ padding: '20px 0' }}>Gruplar aranıyor...</p>
                        ) : gosterilecekGruplar.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="ders-tablosu" style={{ marginTop: '15px', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="baslik-hucre">Grup Adı</th>
                                            <th className="baslik-hucre">Gün</th>
                                            <th className="baslik-hucre">Saat</th>
                                            <th className="baslik-hucre">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gosterilecekGruplar.map(grup => (
                                            <tr key={grup.lessonGroupID}>
                                                <td style={{ fontWeight: 'bold', padding: '10px' }}>{grup.lessonGroupName}</td>
                                                <td style={{ padding: '10px' }}>{grup.day !== null ? GUNLER[grup.day] : '-'}</td>
                                                <td style={{ padding: '10px' }}>{grup.hour ? SAAT_DILIMLERI[grup.hour] : '-'}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <button className="btn-kayit-ol" onClick={() => derseKayitOl(grup)}>
                                                        Seç ve Kaydol
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: '#27ae60', margin: '30px 0', fontWeight: 'bold' }}>
                                ✓ Bu derse ait tüm uygun saatleri seçtiniz veya boş kontenjan kalmadı.
                            </p>
                        )}

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setModalAcik(false)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DersProgrami;