const express = require('express');
const { body } = require('express-validator');
const FamilyMember = require('../models/FamilyMember');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

// Tüm aile bireylerini getir
router.get('/', auth, async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ name: 1 });

    res.json({ familyMembers });
  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni aile bireyi ekle
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('İsim gereklidir'),
  body('relationship').trim().notEmpty().withMessage('İlişki gereklidir'),
  body('color').optional().isHexColor().withMessage('Geçerli bir renk giriniz'),
  body('icon').optional().isString().isLength({ max: 10 }).withMessage('İkon çok uzun')
], validate, async (req, res) => {
  try {
    const { name, relationship, color = '#3B82F6', icon = '👤' } = req.body;

    const familyMember = new FamilyMember({
      user: req.user._id,
      name,
      relationship,
      color,
      icon
    });

    await familyMember.save();

    res.status(201).json({
      message: 'Aile bireyi başarıyla eklendi',
      familyMember
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu isimde bir aile bireyi zaten mevcut' });
    }
    console.error('Create family member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Aile bireyi güncelle
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty().withMessage('İsim boş olamaz'),
  body('relationship').optional().trim().notEmpty().withMessage('İlişki boş olamaz'),
  body('color').optional().isHexColor().withMessage('Geçerli bir renk giriniz'),
  body('icon').optional().isString().isLength({ max: 10 }).withMessage('İkon çok uzun')
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const familyMember = await FamilyMember.findOne({ _id: id, user: userId });
    
    if (!familyMember) {
      return res.status(404).json({ message: 'Aile bireyi bulunamadı' });
    }

    // Güncelleme alanları
    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.relationship) updateFields.relationship = req.body.relationship;
    if (req.body.color) updateFields.color = req.body.color;
    if (req.body.icon) updateFields.icon = req.body.icon;

    Object.assign(familyMember, updateFields);
    await familyMember.save();

    res.json({
      message: 'Aile bireyi başarıyla güncellendi',
      familyMember
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu isimde bir aile bireyi zaten mevcut' });
    }
    console.error('Update family member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Aile bireyi sil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const familyMember = await FamilyMember.findOne({ _id: id, user: userId });
    
    if (!familyMember) {
      return res.status(404).json({ message: 'Aile bireyi bulunamadı' });
    }

    familyMember.isActive = false;
    await familyMember.save();

    res.json({ message: 'Aile bireyi başarıyla silindi' });
  } catch (error) {
    console.error('Delete family member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 