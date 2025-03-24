import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';

enum ActiveTab {
  Acronym,
  Leaderboard
};

export const App = () => {
  const [acronym, setAcronym] = useState('R.E.D.D.I.T.');
  const [leaderboard, setLeaderboard] = useState(false);
  // const page = usePage();
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

  // const acronym = "R.E.D.D.I.T.";
  const letters = acronym.split(".");
  const [lettersState, setLettersState] = useState(letters);
  letters.pop();
  console.log(letters);

  const [activeTab, setActiveTab] = useState(ActiveTab.Acronym);
  const activeTabClasses = "bg-white ";

  return (
    <div className="flex justify-center items-center bg-orange-800 h-full w-full">
      <div className="flex flex-col justify-around items-center p-4 border bg-white rounded-xl h-[80vh] w-[80vw]">
        <div className="flex bg-gray-200 border-gray-700 p-[6px] rounded-xl text-center font-bold text-md shadow-[-4px_-4px_20px_-4px_rgba(0,_0,_0,_0.1)]">
          <div onClick={() => { setActiveTab(ActiveTab.Acronym) }} className={(activeTab == ActiveTab.Acronym ? activeTabClasses : " ") + " p-1 w-[16ch] rounded-xl cursor-pointer"}>
            ACRONYM
          </div>
          <div onClick={() => { setActiveTab(ActiveTab.Leaderboard) }} className={(activeTab == ActiveTab.Leaderboard ? activeTabClasses : " ") + " p-1 w-[16ch] rounded-xl cursor-pointer"}>
            Leaderboard
          </div>
        </div>

        <div>

          {activeTab == ActiveTab.Acronym ?
            <div className="text-center" id="acronym">
              <div>
                {lettersState ?
                  lettersState.map(char => {
                    return (
                      <span key={char + (Math.random() + 1).toString(36).substring(7)}>
                        <span className="shadow-[-3px_-3px_10px_-1px_rgba(0,_0,_0,_0.1)] text-4xl font-bold px-3 py-1 m-1 rounded-xl inline-block w-12">
                          {char}
                        </span>
                        <span className="font-bold">.</span>
                      </span>
                    );
                  })
                  : ""}

                {/* <h1>REDDIT</h1> */}
                <h2 className="font-bold text-blue-900 pt-6 pb-12">Comment the full form of the acronym to play!</h2>
              </div>

              <div className="flex flex-col gap-1">
                <h3>See a cool acronym? Smash that upvote! </h3>
                {/* Earn a special flair!  */}
                <h3>Your acronym got the most karma? You win!</h3>
                <div className="self-end pt-10"><span className="border px-2 py-1 font-bold rounded-xl">About</span></div>
              </div>
            </div>
            : null
          }

          {activeTab == ActiveTab.Leaderboard ?
            <div id="leaderboard">
            </div>
            : null}
        </div>
      </div>
    </div>
    // <>
    //   <div className="text-white">
    //     {acronym ? acronym : "Loading..."}
    //   </div>
    //   <hr/>
    //   <div className='text-white'>
    //     {leaderboard ? 
    //       leaderboardData?.map(((value: any) => {
    //         return <div>Author: {value.author}, Karma: {value.score}, Rank: {value.rank}, Comment: {value.text}</div>
    //       }) )
    //     : "Loading Leaderboard..."}
    //   </div>

    //  </>
  );
};
