<script lang="ts">
    let timerStarted = false;
    //default mode is work 
    let mode : 'Work' | "Break"= "Work";
    const defaultWorkTime = 5;
    const defaultBreakTime = 10;

    //defaultStart time = 25 mins * 60 seconds 
    let time = 5;
    let breakTime = 2;
    const resetTimers = () => {
        //reset to defaults
        time = defaultWorkTime;
        breakTime = defaultBreakTime;

    }
    //make 0-9 -> 00:00
    const paddingTime = (x: number) => {
        return (x < 10) ? '0' + x.toString() : x.toString();
       
    }

    //for string display 
    let minutes:number= Math.floor(time / 60)
    let remainingSeconds:number = (time - minutes * 60)
    let timerInterval: any;
    
    $: if(mode === 'Work' && time === 0 ){
        // clearInterval(timerInterval);
        stopTimer()
        vscode.postMessage({
            command:'alert',
            text: "Take a break."
        })
        // breakTime = 10;
        mode = 'Break';
        minutes = Math.floor(breakTime / 60)
        remainingSeconds = (breakTime - minutes * 60)
    }
    $: if(mode === 'Break' && breakTime === 0){
        // clearInterval(timerInterval);
        stopTimer()
        vscode.postMessage({
            command:'alert',
            text: "Let's get back to work."
        })
        mode = 'Work';
        time = defaultWorkTime;
        minutes = Math.floor(time / 60)
        remainingSeconds = (time - minutes * 60)
        resetTimers()
    }
  
   
 
    const takeTime = () => {
        switch(mode){
            case "Break":
                console.log('is taking from break timer')
                breakTime = breakTime - 1;
                minutes = Math.floor(breakTime / 60)
                remainingSeconds = breakTime - minutes * 60
            
                // if (remainingSeconds < 10){
                //     remainingSeconds = '0' + remainingSeconds.toString()  
                // }else{
                //     remainingSeconds = remainingSeconds.toString();
                // }
            break
            case "Work":
                console.log('is taking from work timer')

                time = time - 1;
                minutes = Math.floor(time / 60)
                remainingSeconds = time - minutes * 60
            
                // if (remainingSeconds < 10){
                //     remainingSeconds = '0' + remainingSeconds.toString()  
                // }else{
                //     remainingSeconds = remainingSeconds.toString();
                // }
            break
        }
       
    }
    
    const startTimer = () => {
        timerStarted=true
        timerInterval = setInterval(takeTime,1000)
    }
    
    const stopTimer = () => {
        clearInterval(timerInterval);
        timerStarted = false
    }
   
</script>

<style>
    .main{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100vh;
        position: relative;
    }
    h1{
        font-size:64px ;
        
    }
    button{
        padding: 10px 15px;
        background-color: #F62359;
        color:white;
        border: none;
        border-radius: 15px;
        cursor: pointer;
    }
    .timer-container{
        display: flex;
        align-items: center;

    }
    .add-subtract-time-btn{
        border: 1px #ffffff solid;
        border-radius: 10px;
        padding: 10px;
        font-size: 26px;
        background-color: transparent;
        background: none;
        margin: 0 30px;
    }
</style>
<!-- react version would be an useEffect listening to  -->

<div class="main">
    <div class="timer-container">
        <button class="add-subtract-time-btn">-</button>
        <h1>{paddingTime(minutes)}:{paddingTime(remainingSeconds)}</h1>
        <button class="add-subtract-time-btn">+</button>
       
    </div> 
    {#if mode === 'Work' && time > 0}
    <button on:click={timerStarted ? stopTimer: startTimer }>{timerStarted ? 'Pause' : "Start Working"}</button>
    {/if}
    {#if mode === 'Break'}
  
    <button on:click={timerStarted ? stopTimer: startTimer }>{timerStarted ? 'Pause' : "Start Break"}</button>
    {/if}

</div>