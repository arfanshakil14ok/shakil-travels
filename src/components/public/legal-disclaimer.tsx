import React from 'react';
import { TriangleAlert } from 'lucide-react';

export const LegalDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-50/90 border-y border-amber-200 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-start gap-3 text-xs leading-relaxed text-amber-950 font-bengali">
        <TriangleAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold text-amber-900 mr-1.5">আইনি সতর্কতা ও তথ্য যাচাইকরণ:</span>
          <span>
            চাকরি ও ভিসা সংক্রান্ত তথ্য সময়ের সাথে পরিবর্তিত হতে পারে। আবেদন করার আগে সংশ্লিষ্ট দেশের সরকারি/ইমিগ্রেশন কর্তৃপক্ষের সর্বশেষ তথ্য যাচাই করুন। কোনো চাকরি বা ভিসা অনুমোদনের নিশ্চয়তা এই ওয়েবসাইট প্রদান করে না।
          </span>
        </div>
      </div>
    </div>
  );
};
