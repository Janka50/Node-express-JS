async function fetchUser() {
    return new Promise((resolve) => {
        setTimeout(() => {
             resolve({id:1, name: 'John'});
         }, 1000);   
        });
    
}

async function fetUser2() {
    return new Promise((resolve) => {
        setTimeout(()=>{
        resolve({id:2 , name : 'Pearce'})
     },1000);
     });
}

async function main() {
    try{
        console.log('fetching user...')
        const user = await fetchUser();
        const user1 = await fetUser2();
        console.log('Fetched :' , user,user1 );
    }
    catch(err){
        console.error('error fetching user', err);
    }
}



main();