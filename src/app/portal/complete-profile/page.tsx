'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/brand-logo';

export default function CompleteProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ছবির সাইজ ৫ মেগাবাইট (5MB) এর কম হতে হবে।');
      return;
    }

    // Check format
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPreview) {
      setErrorMessage('অনুগ্রহ করে একটি পাসপোর্ট সাইজের প্রোফাইল ছবি নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/portal/profile/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoPreview }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('প্রোফাইল ছবি সফলভাবে যুক্ত হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');
        setTimeout(() => {
          router.push('/portal');
          router.refresh();
        }, 1000);
      } else {
        setErrorMessage(data.error || 'ছবি আপলোড ব্যর্থ হয়েছে।');
      }
    } catch {
      setErrorMessage('নেটওয়ার্ক ত্রুটি। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo href="/" size="md" variant="horizontal" className="mx-auto" />
        <h2 className="mt-6 text-2xl font-black text-slate-900 font-bengali">
          প্রোফাইল ছবি যুক্ত করুন
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 font-bengali">
          সরকারি রিক্রুটিং ও ভিসা প্রসেসিং এর জন্য প্রার্থীর পাসপোর্ট সাইজের ছবি বাধ্যতামূলক।
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 sm:rounded-2xl font-bengali">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            {/* Photo Dropzone / Upload Box */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-36 h-36 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group shadow-inner"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-emerald-800 text-center px-2">
                      ছবি নির্বাচন করুন
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans mt-0.5">JPG, PNG, WebP</span>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{photoPreview ? 'ছবি পরিবর্তন করুন' : 'ফাইল ব্রাউজ করুন'}</span>
              </button>
            </div>

            {/* Instruction Checklist */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ছবির নির্দেশিকা:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[10px]">
                <li>পরিষ্কার ও স্পষ্ট পাসপোর্ট সাইজের রঙিন ছবি।</li>
                <li>মুখমণ্ডল ও চোখ স্পষ্টভাবে দৃশ্যমান হতে হবে।</li>
                <li>সর্বোচ্চ ফাইল সাইজ: ৫ মেগাবাইট (5MB)।</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !photoPreview}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span>আপলোড হচ্ছে...</span>
              ) : (
                <>
                  <span>ছবি সংরক্ষণ ও পোর্টাল সক্রিয় করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
