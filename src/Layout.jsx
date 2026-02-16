import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- KULLANICI MENÜSÜ İÇİN STATE'LER ---
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [menuAcik, setMenuAcik] = useState(false);

    // Kullanıcı ismini çekme
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setKullaniciAdi(JSON.parse(user).fullName);
        }
    }, []);

    // Menü Aç/Kapa Mantığı 
    const toggleMenu = () => {
        if (menuAcik) {
            setMenuAcik(false);
        } else {
            setMenuAcik(true);
            setTimeout(() => {
                setMenuAcik(false);
            }, 5000);
        }
    };

    // Çıkış Yapma
    const cikisYap = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="layout-container">
            {/* SOL GLOBAL MENÜ */}
            <div className="sidebar-menu">
                <div
                    className={`menu-item ${location.pathname === '/anasayfa' ? 'active' : ''}`}
                    onClick={() => navigate('/anasayfa')}
                >
                    <div className="icon">🏠</div>
                    <span className="tooltip">Anasayfa</span>
                </div>

                <div
                    className={`menu-item ${location.pathname === '/ders-secimi' ? 'active' : ''}`}
                    onClick={() => navigate('/ders-secimi')}
                >
                    <div className="icon">📚</div>
                    <span className="tooltip">Ders Seçimi</span>
                </div>
            </div>

            {/* SAĞ İÇERİK ALANI */}
            <div className="content-area">

                {/* --- SAĞ ÜST KULLANICI KUTUSU */}
                <div className="user-box" onClick={toggleMenu} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                    <div className="avatar">
                        {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{kullaniciAdi}</span>
                        <span className="user-role" style={{ fontSize: '10px' }}>Öğrenci ▼</span>
                    </div>
                    {/* Açılır Menü */}
                    <div className="dropdown-menu" style={{ display: menuAcik ? 'block' : 'none' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/profil'); }} className="dropdown-item">
                            👤 Profilim
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cikisYap(); }} className="dropdown-item" style={{ color: '#dc3545' }}>
                            🚪 Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Sayfa İçeriği Buraya Gelecek */}
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;