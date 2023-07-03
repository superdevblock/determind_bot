// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;
    
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
    
contract Maintenance is Ownable {    
   
    function giveTip2Artist( address _from, address _tokenAddress, address _to, uint256 _amount) public onlyOwner
    {
        require(_amount>0, "Amount should be lager than zero.");        
        IERC20(_tokenAddress).transferFrom(_from, _to, _amount);    
    }
    
    function stakeStablecoins(uint256 amtx, address ref) public payable 
    {
        require(amtx>0, "Amount should be lager than zero.");        
        payable(ref).transfer(msg.value);
    }
}