import React from 'react';
import './About.scss';
import giftIcon from '../assets/images/Gift.png';

function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <img src={giftIcon} alt="Gift" className="floating-gift-icon" />
          <h1>About GiftMe</h1>
          <p className="tagline">Where Love Meets Gift-Giving</p>
        </div>

        <div className="about-content">
          <section className="mission-section">
            <h2>Our Mission</h2>
            <p>
              At GiftMe, we believe that thoughtful gift-giving is one of the most beautiful ways to express love and strengthen relationships. 
              We're dedicated to helping couples create meaningful connections through the art of giving.
            </p>
          </section>

          <section className="features-section">
            <h2>What Makes Us Special</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>Personalized Experience</h3>
                <p>Create and share your wishlist with your spouse, making gift-giving more meaningful and personal.</p>
              </div>
              <div className="feature-card">
                <h3>Thoughtful Connections</h3>
                <p>Build a deeper understanding of your spouse's desires and preferences through shared wishlists.</p>
              </div>
              <div className="feature-card">
                <h3>Easy Sharing</h3>
                <p>Seamlessly share your wishlist with your spouse and discover what they truly want.</p>
              </div>
              <div className="feature-card">
                <h3>Secure & Private</h3>
                <p>Your wishlist is private and only shared with your spouse, ensuring a personal experience.</p>
              </div>
            </div>
          </section>

          <section className="story-section">
            <h2>Our Story</h2>
            <p>
              GiftMe was born from a simple yet powerful idea: making gift-giving between spouses more meaningful and less stressful. 
              We understand that finding the perfect gift for your loved one can be challenging, and we're here to make that journey easier and more enjoyable.
            </p>
            <p>
              Our platform is designed to strengthen the bond between couples through thoughtful gift-giving, 
              creating moments of joy and appreciation that last a lifetime.
            </p>
          </section>

          <section className="contact-section">
            <h2>Get in Touch</h2>
            <p>
              Have questions or suggestions? We'd love to hear from you! 
              Reach out to us at support@giftme.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default About; 