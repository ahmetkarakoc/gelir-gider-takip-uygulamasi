import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Palette } from 'lucide-react';
import { familyMemberService } from '../services/familyMemberService';
import FamilyMemberModal from '../components/FamilyMemberModal';
import toast from 'react-hot-toast';

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const response = await familyMemberService.getFamilyMembers();
      setFamilyMembers(response.familyMembers);
    } catch (error) {
      toast.error('Aile bireyleri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Bu aile bireyini silmek istediğinizden emin misiniz?')) {
      try {
        await familyMemberService.deleteFamilyMember(memberId);
        toast.success('Aile bireyi başarıyla silindi');
        loadFamilyMembers();
      } catch (error) {
        toast.error('Aile bireyi silinirken hata oluştu');
      }
    }
  };

  const handleModalSubmit = async (memberData) => {
    try {
      if (editingMember) {
        await familyMemberService.updateFamilyMember(editingMember._id, memberData);
        toast.success('Aile bireyi başarıyla güncellendi');
      } else {
        await familyMemberService.createFamilyMember(memberData);
        toast.success('Aile bireyi başarıyla eklendi');
      }
      setIsModalOpen(false);
      loadFamilyMembers();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('İşlem sırasında hata oluştu');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Aile Bireyleri</h1>
            <p className="text-gray-600 mt-2">Aile bireylerinizi yönetin ve harcamaları ilişkilendirin</p>
          </div>
          <button
            onClick={handleAddMember}
            className="btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aile Bireyi Ekle
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz aile bireyi eklenmemiş</h3>
            <p className="text-gray-600 mb-6">Aile bireylerinizi ekleyerek harcamaları kişilere göre takip edebilirsiniz.</p>
            <button
              onClick={handleAddMember}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Aile Bireyini Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {familyMembers.map((member) => (
              <div
                key={member._id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4"
                style={{ borderLeftColor: member.color }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{member.relationship}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-full hover:bg-primary-50"
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member._id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="truncate">Renk: {member.color}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FamilyMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        member={editingMember}
      />
    </div>
  );
};

export default FamilyMembers; 