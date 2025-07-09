export default function AdminCardsPage() {
  return (
    <div>
      <h1>カード管理画面</h1>
      <div>
        <p>名前</p>
        <input type="text" placeholder="名前を入力" />
      </div>
      <div>
        <p>コスト</p>
        <input type="number" min={1} max={10} />
      </div>
      <div>
        <p>攻撃力</p>
        <input type="number" min={0} max={100} />
      </div>
      <div>
        <p>HP</p>
        <input type="number" min={1} max={100} />
      </div>
    </div>
  );
}
