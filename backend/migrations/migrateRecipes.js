/**
 * Migration script để chuyển đổi Recipe từ cấu trúc cũ (2 documents với size) 
 * sang cấu trúc mới (1 document với ingredientsSmall và ingredientsLarge)
 * 
 * Cách chạy:
 * node backend/migrations/migrateRecipes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGGODB_CONNECTIONSTRING);
    console.log('✅ Đã kết nối database');
  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error);
    process.exit(1);
  }
};

// Schema cũ (tạm thời để đọc dữ liệu cũ)
const oldRecipeSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  size: {
    type: String,
    enum: ['small', 'large'],
    required: true,
  },
  ingredients: [{
    name: String,
    amount: Number,
    unit: String,
  }],
}, { timestamps: true, strict: false });

const OldRecipe = mongoose.model('Recipe', oldRecipeSchema, 'recipes');

// Schema mới
const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unit: {
    type: String,
    required: true,
    enum: ['ml', 'g'],
  },
});

const newRecipeSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
  },
  ingredientsSmall: {
    type: [ingredientSchema],
    required: true,
  },
  ingredientsLarge: {
    type: [ingredientSchema],
    required: true,
  },
}, { timestamps: true, strict: false });

const NewRecipe = mongoose.model('NewRecipe', newRecipeSchema, 'recipes');

// Migration function
const migrateRecipes = async () => {
  try {
    console.log('🔄 Bắt đầu migration...\n');

    // Lấy tất cả recipes cũ
    const oldRecipes = await OldRecipe.find({}).lean();
    console.log(`📊 Tìm thấy ${oldRecipes.length} recipes cũ\n`);

    // Nhóm theo productId
    const recipesByProduct = {};
    oldRecipes.forEach(recipe => {
      const productId = recipe.productId.toString();
      if (!recipesByProduct[productId]) {
        recipesByProduct[productId] = {};
      }
      recipesByProduct[productId][recipe.size] = recipe;
    });

    console.log(`📦 Tìm thấy ${Object.keys(recipesByProduct).length} products\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Migrate từng product
    for (const [productId, recipes] of Object.entries(recipesByProduct)) {
      try {
        const smallRecipe = recipes.small;
        const largeRecipe = recipes.large;

        // Kiểm tra xem đã có recipe mới chưa
        const existingNewRecipe = await NewRecipe.findOne({ productId });
        if (existingNewRecipe) {
          console.log(`⏭️  Đã bỏ qua productId ${productId} (đã có recipe mới)`);
          skipped++;
          continue;
        }

        // Validate: cần có cả small và large
        if (!smallRecipe || !largeRecipe) {
          console.log(`⚠️  Bỏ qua productId ${productId} (thiếu small hoặc large)`);
          console.log(`   - Small: ${smallRecipe ? '✓' : '✗'}`);
          console.log(`   - Large: ${largeRecipe ? '✓' : '✗'}`);
          skipped++;
          continue;
        }

        // Tạo recipe mới
        const newRecipe = new NewRecipe({
          productId: smallRecipe.productId,
          ingredientsSmall: smallRecipe.ingredients || [],
          ingredientsLarge: largeRecipe.ingredients || [],
          createdAt: smallRecipe.createdAt || new Date(),
          updatedAt: new Date(),
        });

        await newRecipe.save();
        console.log(`✅ Đã migrate productId ${productId}`);
        migrated++;

        // Xóa recipes cũ
        await OldRecipe.deleteMany({ productId: smallRecipe.productId });
        console.log(`   🗑️  Đã xóa recipes cũ cho productId ${productId}\n`);

      } catch (error) {
        console.error(`❌ Lỗi khi migrate productId ${productId}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Kết quả migration:');
    console.log(`   ✅ Đã migrate: ${migrated}`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped}`);
    console.log(`   ❌ Lỗi: ${errors}`);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình migration:', error);
    throw error;
  }
};

// Chạy migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateRecipes();
    console.log('\n✅ Migration hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration thất bại:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  runMigration();
}

module.exports = { migrateRecipes };



