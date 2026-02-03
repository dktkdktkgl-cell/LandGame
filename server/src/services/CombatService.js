class CombatService {
  // 전투 해결
  async resolveCombat(client, gameId, tile, attackerId, attackerTroopCount) {
    const defenderId = tile.owner_id;
    const defenderTroopCount = tile.troop_count;

    // 전투 결과 계산
    let winner, loser, winnerRemainingTroops;

    if (attackerTroopCount > defenderTroopCount) {
      // 공격자 승리
      winner = attackerId;
      loser = defenderId;
      winnerRemainingTroops = attackerTroopCount - defenderTroopCount;

      // 타일 소유권 변경
      await client.query(
        'UPDATE tiles SET owner_id = $1, troop_count = $2 WHERE id = $3',
        [attackerId, winnerRemainingTroops, tile.id]
      );

      // 플레이어 땅 개수 업데이트
      await client.query(
        `UPDATE players SET land_count = (
          SELECT COUNT(*) FROM tiles WHERE owner_id = $1
        ) WHERE id = $1`,
        [attackerId]
      );

      await client.query(
        `UPDATE players SET land_count = (
          SELECT COUNT(*) FROM tiles WHERE owner_id = $1
        ) WHERE id = $1`,
        [defenderId]
      );

      return {
        winner: attackerId,
        loser: defenderId,
        winnerLoss: defenderTroopCount,
        loserLoss: defenderTroopCount,
        remainingTroops: winnerRemainingTroops,
        tileOwnerChanged: true
      };
    } else if (defenderTroopCount > attackerTroopCount) {
      // 방어자 승리
      winner = defenderId;
      loser = attackerId;
      winnerRemainingTroops = defenderTroopCount - attackerTroopCount;

      // 타일 군인 수 업데이트
      await client.query(
        'UPDATE tiles SET troop_count = $1 WHERE id = $2',
        [winnerRemainingTroops, tile.id]
      );

      return {
        winner: defenderId,
        loser: attackerId,
        winnerLoss: attackerTroopCount,
        loserLoss: attackerTroopCount,
        remainingTroops: winnerRemainingTroops,
        tileOwnerChanged: false
      };
    } else {
      // 무승부 - 모든 군인 사망
      await client.query(
        'UPDATE tiles SET troop_count = 0 WHERE id = $1',
        [tile.id]
      );

      return {
        winner: null,
        loser: null,
        winnerLoss: attackerTroopCount,
        loserLoss: defenderTroopCount,
        remainingTroops: 0,
        tileOwnerChanged: false,
        draw: true
      };
    }
  }
}

export default new CombatService();
