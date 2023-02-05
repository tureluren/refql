import Table from "../Table";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  teamId: number;
  positionId: number;
}

const Player = Table ("player", [
]);

export default Player;