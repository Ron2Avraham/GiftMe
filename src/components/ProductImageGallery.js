import React, { useState } from 'react';
import './ProductImageGallery.scss';

const ProductImageGallery = ({ images, alt }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Ensure we always have at least one image
  const imageList = images && images.length > 0 ? images : ['https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'];

  const handleImageClick = (index) => {
    setSelectedImage(index);
    setIsZoomed(false);
  };

  const handleMainImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    
    const image = e.currentTarget;
    const rect = image.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    image.style.setProperty('--x', `${x * 100}%`);
    image.style.setProperty('--y', `${y * 100}%`);
  };

  return (
    <div className="product-image-gallery">
      <div className="main-image-container">
        <img
          src={imageList[selectedImage]}
          alt={alt}
          className={`main-image ${isZoomed ? 'zoomed' : ''}`}
          onClick={handleMainImageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
        />
        {isZoomed && (
          <div className="zoom-hint">
            <span>Click to exit zoom</span>
          </div>
        )}
      </div>
      
      {imageList.length > 1 && (
        <div className="thumbnail-container">
          {imageList.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${alt} - View ${index + 1}`}
              className={`thumbnail ${selectedImage === index ? 'selected' : ''}`}
              onClick={() => handleImageClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery; 