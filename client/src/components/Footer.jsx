import { Mail, MapPin, Phone } from 'lucide-react';
import LogoMark from './LogoMark.jsx';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <LogoMark height={72} />
          </div>
          <p>Connecting creators, brands, and opportunities</p>
        </div>




        <div className="footer-section">
          <h4>Contact Us</h4>
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={16} />
              <span>nextgen@gmail.com</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>9766433737</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Kathmandu, Nepal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} NextGen. All rights reserved.</p>
      </div>
    </footer>
  );
}
