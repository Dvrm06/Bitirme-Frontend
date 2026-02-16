import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            const response = await fetch('http://localhost:8001/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usernameoremail: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Giriş başarısız oldu');
            }

            localStorage.setItem('token', data.data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.data));

            navigate('/anasayfa');

        } catch (err) {
            setError(err.message);
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