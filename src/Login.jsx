import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // api.js'de base URL'i verdiğimiz için sadece endpoint'i yazıyoruz
            const response = await api.post('/users/login', {
                usernameoremail: formData.username,
                password: formData.password
            });

            // Axios ile veri direkt response.data içinde gelir
            const data = response.data;

            // Token ve kullanıcı bilgilerini kaydediyoruz
            localStorage.setItem('token', data.data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.data));

            // Başarılı girişte anasayfaya yönlendiriyoruz
            navigate('/anasayfa');

        } catch (err) {
            // Axios'ta hata mesajları err.response.data içinde döner
            // Eğer back-end'den özel bir mesaj gelmezse varsayılan mesajı gösteririz
            const errorMessage = err.response?.data?.message || 'Giriş başarısız oldu, bilgilerinizi kontrol edin.';
            setError(errorMessage);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2 className="title">Öğrenci Girişi</h2>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Kullanıcı Adı veya Email</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input"
                            placeholder="ör: test@test.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Şifre</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="******"
                            required
                        />
                    </div>

                    <button type="submit" className="button">Giriş Yap</button>
                </form>
            </div>
        </div>
    );
};

export default Login;