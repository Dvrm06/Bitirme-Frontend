import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DersProgrami from './DersProgrami';
import Profile from './Profile';
import Anasayfa from './Anasayfa';
import Layout from './Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/anasayfa" element={<Anasayfa />} />
          <Route path="/ders-secimi" element={<DersProgrami />} />
          <Route path="/profil" element={<Profile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;