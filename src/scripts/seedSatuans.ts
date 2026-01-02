import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials dari .env
const supabaseUrl = 'https://daescrwcilnxvieslgkv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZXNjcndjaWxueHZpZXNsZ2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTYzNTEsImV4cCI6MjA4Mjc5MjM1MX0.GFfle6j38b2vtOm6_3ou4gC1sIuMJ7IhjWEPRAJ73-c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedSatuans() {
  console.log('🌱 Menambahkan data satuan ke database...');

  // Data satuan yang akan ditambahkan
  const satuans = [
    { nama_satuan: 'Pcs' },
    { nama_satuan: 'Pack' },
    { nama_satuan: 'Box' }, // Akan ditampilkan sebagai "Dus" di UI
  ];

  try {
    // Cek apakah sudah ada data
    const { data: existing, error: checkError } = await supabase
      .from('satuans')
      .select('*');

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }

    if (existing && existing.length > 0) {
      console.log('ℹ️ Data satuan sudah ada di database:', existing);
      return;
    }

    // Insert data satuan
    const { data, error } = await supabase
      .from('satuans')
      .insert(satuans)
      .select();

    if (error) {
      console.error('❌ Error inserting satuans:', error);
      return;
    }

    console.log('✅ Berhasil menambahkan data satuan:', data);
    console.log('\n📋 Satuan yang tersedia:');
    data?.forEach((s, i) => {
      const displayName = s.nama_satuan.toLowerCase() === 'box' ? 'Dus' : s.nama_satuan;
      console.log(`   ${i + 1}. ${displayName} (ID: ${s.id})`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan seeding
seedSatuans();
