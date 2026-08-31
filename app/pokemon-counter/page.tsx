'use client';

import { useState } from 'react';

const TOTAL_POKEMON = 151;
const SPRITE_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export default function PokemonCounterPage(): React.ReactElement {
  const [count, setCount] = useState(1);

  const pokemonId = ((count - 1) % TOTAL_POKEMON) + 1;

  function increment(): void {
    setCount((c) => c + 1);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Pokémon Counter</h1>

      <div className="flex flex-col items-center gap-4">
        <img
          src={`${SPRITE_BASE_URL}/${pokemonId}.png`}
          alt={`Pokemon #${pokemonId}`}
          width={200}
          height={200}
          className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        />
        <p className="text-sm text-gray-400">#{pokemonId}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <span className="font-mono text-6xl font-bold">{count}</span>
        <button
          onClick={increment}
          className="rounded-xl bg-yellow-400 px-8 py-3 text-lg font-bold text-gray-900 transition-all hover:bg-yellow-300 active:scale-95"
        >
          +1
        </button>
      </div>
    </main>
  );
}
