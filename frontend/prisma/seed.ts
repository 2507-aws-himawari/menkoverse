import { PrismaClient } from '@prisma/client';
import type { RentalDeck, RentalDeckCard } from '@prisma/client';

const prisma = new PrismaClient();

const rentalDecksData: RentalDeck[] = [
  { id: 'R-1', name: 'パワーデッキ' },
];
const deckCardConfigs: { [key: string]: (RentalDeckCard & { count: number })[] } = {
  'パワーデッキ': [
    { id: 'RDC-1', rentalDeckId: 'R-1', followerId: 'F-d048668b-f80e-40f2-b1d7-8dcd1949807e', count: 3}, // ゴブリン
    { id: 'RDC-2', rentalDeckId: 'R-1', followerId: 'F-c8d069c2-89c5-4275-b594-06699f26e96b', count: 3}, // ベルエンジェル
    { id: 'RDC-3', rentalDeckId: 'R-1', followerId: 'F-71311521-09e2-48d3-bc24-856bda493959', count: 3}, // ルビィ
    { id: 'RDC-4', rentalDeckId: 'R-1', followerId: 'F-44a11a66-4af3-4a06-b35a-6e962ded852d', count: 3}, // フィルドア
    { id: 'RDC-5', rentalDeckId: 'R-1', followerId: 'F-e2ff5b64-50cb-4528-9026-9d4be766b274', count: 3}, // ファイター
    { id: 'RDC-6', rentalDeckId: 'R-1', followerId: 'F-3923f039-cb0f-415c-a75b-4fca0629131e', count: 3}, // 観察の探偵
    { id: 'RDC-7', rentalDeckId: 'R-1', followerId: 'F-a465a7ba-e46f-407d-9051-739f63f2ca6b', count: 3}, // アポロン
    { id: 'RDC-8', rentalDeckId: 'R-1', followerId: 'F-02ae4049-f6f4-4a15-aba4-6fc8c95ee6d8', count: 3}, // アンリエット
    { id: 'RDC-9', rentalDeckId: 'R-1', followerId: 'F-0ba3989b-0023-4434-9076-18110a7f92e6', count: 3}, // ゴリアテ
    { id: 'RDC-10', rentalDeckId: 'R-1', followerId: 'F-fe8d3ecb-6265-4be3-9559-43d67865efe6', count: 3}, // オリヴィエ
    { id: 'RDC-11', rentalDeckId: 'R-1', followerId: 'F-59a23042-a687-47c0-b50f-7775d50b2b43', count: 3}, // キャラバンマンモス
    { id: 'RDC-12', rentalDeckId: 'R-1', followerId: 'F-e9cf7cce-d7a5-4750-ac8a-0166d6b8fb06', count: 3}, // サタン
    { id: 'RDC-13', rentalDeckId: 'R-1', followerId: 'F-d9a78fad-70c2-47de-b472-397e563a9d6f', count: 3}, // バハムート
    { id: 'RDC-14', rentalDeckId: 'R-1', followerId: 'F-36747b4e-61ba-4b08-abe4-adffd9198892', count: 1}, // ゼウス
  ],
};

async function main() {
  // rentalDecksData からデッキを作成し、作成結果を rentalDecks 配列に格納
  const rentalDecks: RentalDeck[] = [];
  for (const deck of rentalDecksData) {
    const created = await prisma.rentalDeck.create({ data: { id: deck.id, name: deck.name } });
    rentalDecks.push(created);
  }

  // RentalDeckCardの作成
  for (const deck of rentalDecks) {
    const configs = deckCardConfigs[deck.name];
    let total = 0;
    if (!configs) continue;
    for (const conf of configs) {
      for (let i = 0; i < conf.count; i++) {
        if (total >= 40) break;
        await prisma.rentalDeckCard.create({
          data: {
            id: conf.id,
            rentalDeckId: deck.id,
            followerId: conf.followerId,
          },
        });
        total++;
      }
      if (total >= 40) break;
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
