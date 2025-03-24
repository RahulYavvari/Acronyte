const API_URL = "https://pokeapi.co/api/v2/pokemon";

export const getPokemonByName = async (name: string) => {
  const response = await fetch(`${API_URL}/${name}`);
  const data = await response.json();

  return data;
};
