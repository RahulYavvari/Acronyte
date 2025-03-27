import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';

enum ActiveTab {
  Acronym,
  Leaderboard,
}

export const App = () => {
  const [acronym, setAcronym] = useState('');
  const [leaderboard, setLeaderboard] = useState(false);
  const [activeText, setActiveText] = useState<string | null>(null);

  const initData = useDevvitListener('INIT_RESPONSE');
  const leaderboardData = useDevvitListener('GET_LEADERBOARD_RESPONSE');

  useEffect(() => {
    sendToDevvit({ type: 'INIT' });
    sendToDevvit({ type: 'GET_LEADERBOARD_REQUEST' });
  }, []);

  useEffect(() => {
    if (initData) {
      setAcronym(initData.acronym);
    }
  }, [initData]);

  useEffect(() => {
    if (leaderboardData?.length) {
      setLeaderboard(true);
    }
  }, [leaderboardData]);

  // Global click listener to close the floating div when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeText) {
        setActiveText(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeText]);

  const formatAcronym = (acronym: string) => {
    acronym = 'R.E.D.D.I.T.';
    const letters = acronym.split('.');
    letters.pop();
    return letters;
  };

  const [activeTab, setActiveTab] = useState(ActiveTab.Acronym);
  const activeTabClasses = "bg-white ";

  return (
    <div className="flex justify-center items-center bg-orange-800 h-full w-full relative">
      <div className="flex shadow-2xl flex-col relative justify-start items-center p-3 pt-[7rem] border bg-white rounded-md h-[80vh] w-[80vw]">
        <div className="flex absolute top-10 bg-gray-200 border-gray-700 p-[6px] rounded-xl text-center font-bold text-md shadow-[-4px_-4px_20px_-4px_rgba(0,_0,_0,_0.1)]">
          <div
            onClick={() => { setActiveTab(ActiveTab.Acronym); }}
            className={(activeTab === ActiveTab.Acronym ? activeTabClasses : " ") + " p-1 w-[16ch] rounded-xl cursor-pointer"}
          >
            ACRONYM
          </div>
          <div
            onClick={() => { setActiveTab(ActiveTab.Leaderboard); }}
            className={(activeTab === ActiveTab.Leaderboard ? activeTabClasses : " ") + " p-1 w-[16ch] rounded-xl cursor-pointer"}
          >
            Leaderboard
          </div>
        </div>

        <div>
          {activeTab === ActiveTab.Acronym ? (
            <div className="text-center pt-10" id="acronym">
              <div>
                {acronym ? (
                  formatAcronym(acronym).map((char) => {
                    return (
                      <span key={char + (Math.random() + 1).toString(36).substring(7)}>
                        <span className="shadow-[-3px_-3px_10px_-1px_rgba(0,_0,_0,_0.1)] text-4xl font-bold px-3 py-1 m-1 rounded-xl inline-block w-12">
                          {char}
                        </span>
                        <span className="font-bold">.</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="font-bold text-4xl text-gray-300">Loading...</span>
                )}
                <h2 className="font-bold text-blue-900 pt-6 pb-12">
                  Comment the full form of the acronym to play!
                </h2>
              </div>

              <div className="flex flex-col gap-1">
                <h3>See a cool acronym? Smash that upvote!</h3>
                <h3>Your acronym got the most karma? You win!</h3>
                <div className="self-end pt-10">
                  <div className="px-2 py-1 text-xs font-bold text-gray-400 cursor-pointer"><span className='text-orange-600'>Devvit</span> under the hood.</div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === ActiveTab.Leaderboard ? (
            <div id="leaderboard">
              {leaderboard ? (
                <div className="relative overflow-x-auto overflow-y-scroll max-h-[350px] shadow-xl sm:rounded-lg">
                  <table className="w-full text-center text-sm rtl:text-right text-gray-500">
                    <thead className="text-xs text-white uppercase bg-orange-600">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Username
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Karma
                        </th>
                        <th scope="col" className="px-6 py-3">
                          See it?
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData?.map((value: any) => (
                        <tr key={value.author} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {value.rank}
                          </th>
                          <td className="px-6 py-4">{value.author}</td>
                          <td className="px-6 py-4">{value.score}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the global click listener from immediately closing the floating div.
                                setActiveText(value.text);
                              }}
                              className="text-blue-500 cursor-pointer"
                            >
                              See me
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-2xl pt-20 font-bold text-gray-500">No submissions yet.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Full-screen overlay with blur and slow transition */}
      {activeText && (
        <div 
          onClick={() => setActiveText(null)}
          className="fixed inset-0 backdrop-blur-3xl bg-black/30 z-40 transition-opacity duration-1000 ease-in-out"
        ></div>
      )}

      {/* Floating div to show the active text with slow transition */}
      {activeText && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-400 p-4 shadow-xl z-50 cursor-pointer transition-all duration-500 ease-in-out"
        >
          {activeText}
        </div>
      )}
    </div>
  );
};
